import { DaemoFunction } from 'daemo-engine';
import { z } from 'zod';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import "reflect-metadata";

export class DriveService {
  private drive: drive_v3.Drive;
  private auth: OAuth2Client;

  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    this.auth = new google.auth.OAuth2(clientId, clientSecret);
    this.auth.setCredentials({ refresh_token: refreshToken });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  @DaemoFunction({
    description: "Search for files in Google Drive.",
    inputSchema: z.object({
      query: z.string().describe("Search query (e.g., 'name contains \"project\"' or 'fullText contains \"budget\"')"),
      limit: z.number().optional().describe("Number of files to return (default 10)")
    }),
    outputSchema: z.object({
      files: z.array(z.object({
        id: z.string(),
        name: z.string(),
        mimeType: z.string(),
        webViewLink: z.string().optional()
      }))
    })
  })
  async searchFiles(args: { query: string, limit?: number }) {
    try {
      // Basic q parameter construction if user gives simple text, otherwise assume valid drive query
      const q = args.query.includes("=") || args.query.includes("contains") 
        ? args.query 
        : `name contains '${args.query}'`;

      const res = await this.drive.files.list({
        q: q,
        pageSize: args.limit || 10,
        fields: 'files(id, name, mimeType, webViewLink)',
      });

      return {
        files: res.data.files?.map(f => ({
          id: f.id || '',
          name: f.name || 'Untitled',
          mimeType: f.mimeType || '',
          webViewLink: f.webViewLink || undefined
        })) || []
      };
    } catch (error) {
      console.error("Error searching files:", error);
      return { files: [] };
    }
  }

  @DaemoFunction({
    description: "Read the text content of a file (Google Docs or plain text) for summarization or analysis.",
    inputSchema: z.object({
      fileId: z.string().describe("The ID of the file to read")
    }),
    outputSchema: z.object({
      content: z.string().describe("Text content of the file"),
      success: z.boolean()
    })
  })
  async readFileContent(args: { fileId: string }) {
    try {
      // First check mimeType to decide how to export
      const fileInfo = await this.drive.files.get({ fileId: args.fileId, fields: 'mimeType' });
      const mimeType = fileInfo.data.mimeType;

      let res;
      if (mimeType === 'application/vnd.google-apps.document') {
        // Export Google Docs to plain text
        res = await this.drive.files.export({
          fileId: args.fileId,
          mimeType: 'text/plain'
        });
      } else {
        // Try to get content directly (works for text/plain, etc.)
        // Note: For binary files like PDF, this returns stream/buffer, simpler to restrict to text for this bounty agent
        res = await this.drive.files.get({
          fileId: args.fileId,
          alt: 'media'
        });
      }

      // Ensure content is string
      const content = typeof res.data === 'string' 
        ? res.data 
        : JSON.stringify(res.data); // Fallback for JSON/Objects

      return { content, success: true };
    } catch (error) {
      console.error("Error reading file:", error);
      return { content: "Error reading file content. It might be a binary file or require different permissions.", success: false };
    }
  }

  @DaemoFunction({
    description: "Create a new folder in Google Drive.",
    inputSchema: z.object({
      name: z.string().describe("Name of the folder"),
      parentId: z.string().optional().describe("ID of the parent folder (optional)")
    }),
    outputSchema: z.object({
      folderId: z.string().optional(),
      webViewLink: z.string().optional(),
      success: z.boolean()
    })
  })
  async createFolder(args: { name: string, parentId?: string }) {
    try {
      const fileMetadata: any = {
        name: args.name,
        mimeType: 'application/vnd.google-apps.folder',
      };
      if (args.parentId) {
        fileMetadata.parents = [args.parentId];
      }

      const res = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, webViewLink',
      });

      return {
        folderId: res.data.id || undefined,
        webViewLink: res.data.webViewLink || undefined,
        success: true
      };
    } catch (error) {
      console.error("Error creating folder:", error);
      return { success: false };
    }
  }

  @DaemoFunction({
    description: "Move a file to a different folder.",
    inputSchema: z.object({
      fileId: z.string().describe("The ID of the file to move"),
      folderId: z.string().describe("The ID of the destination folder")
    }),
    outputSchema: z.object({
      success: z.boolean()
    })
  })
  async moveFile(args: { fileId: string, folderId: string }) {
    try {
      // Retrieve the existing parents to remove
      const file = await this.drive.files.get({
        fileId: args.fileId,
        fields: 'parents'
      });
      
      const previousParents = file.data.parents?.join(',') || '';

      await this.drive.files.update({
        fileId: args.fileId,
        addParents: args.folderId,
        removeParents: previousParents,
        fields: 'id, parents'
      });

      return { success: true };
    } catch (error) {
      console.error("Error moving file:", error);
      return { success: false };
    }
  }
}

