import { DaemoFunction } from 'daemo-engine';
import { z } from 'zod';
import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import "reflect-metadata";

export class SheetService {
  private sheets: sheets_v4.Sheets;
  private auth: OAuth2Client;

  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    this.auth = new google.auth.OAuth2(clientId, clientSecret);
    this.auth.setCredentials({ refresh_token: refreshToken });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  @DaemoFunction({
    description: "Read values from a specific range in a Google Sheet.",
    inputSchema: z.object({
      spreadsheetId: z.string().describe("The ID of the spreadsheet"),
      range: z.string().describe("The A1 notation of the range to read (e.g., 'Sheet1!A1:B10')")
    }),
    outputSchema: z.object({
      values: z.array(z.array(z.string())).optional(),
      success: z.boolean()
    })
  })
  async readSheetData(args: { spreadsheetId: string, range: string }) {
    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: args.spreadsheetId,
        range: args.range,
      });

      // Convert all values to strings to ensure type safety with Zod
      const stringValues = res.data.values?.map(row => 
        row.map(cell => String(cell))
      );

      return {
        values: stringValues,
        success: true
      };
    } catch (error) {
      console.error("Error reading sheet:", error);
      return { success: false };
    }
  }

  @DaemoFunction({
    description: "Update values in a specific range in a Google Sheet.",
    inputSchema: z.object({
      spreadsheetId: z.string().describe("The ID of the spreadsheet"),
      range: z.string().describe("The A1 notation of the range to update"),
      values: z.array(z.array(z.string())).describe("The 2D array of values to write")
    }),
    outputSchema: z.object({
      updatedCells: z.number().optional(),
      success: z.boolean()
    })
  })
  async updateSheetData(args: { spreadsheetId: string, range: string, values: string[][] }) {
    try {
      const res = await this.sheets.spreadsheets.values.update({
        spreadsheetId: args.spreadsheetId,
        range: args.range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: args.values
        }
      });

      return {
        updatedCells: res.data.updatedCells || undefined,
        success: true
      };
    } catch (error) {
      console.error("Error updating sheet:", error);
      return { success: false };
    }
  }

  @DaemoFunction({
    description: "Append rows of data to a Google Sheet.",
    inputSchema: z.object({
      spreadsheetId: z.string().describe("The ID of the spreadsheet"),
      range: z.string().describe("The A1 notation of the sheet or range to append to"),
      values: z.array(z.array(z.string())).describe("The 2D array of values to append")
    }),
    outputSchema: z.object({
      updates: z.object({
        updatedRange: z.string().optional(),
        updatedRows: z.number().optional()
      }).optional(),
      success: z.boolean()
    })
  })
  async appendSheetData(args: { spreadsheetId: string, range: string, values: string[][] }) {
    try {
      const res = await this.sheets.spreadsheets.values.append({
        spreadsheetId: args.spreadsheetId,
        range: args.range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: args.values
        }
      });

      return {
        updates: {
          updatedRange: res.data.updates?.updatedRange || undefined,
          updatedRows: res.data.updates?.updatedRows || undefined
        },
        success: true
      };
    } catch (error) {
      console.error("Error appending to sheet:", error);
      return { success: false };
    }
  }

  @DaemoFunction({
    description: "Create a new Google Spreadsheet.",
    inputSchema: z.object({
      title: z.string().describe("The title of the new spreadsheet")
    }),
    outputSchema: z.object({
      spreadsheetId: z.string().optional(),
      spreadsheetUrl: z.string().optional(),
      success: z.boolean()
    })
  })
  async createSpreadsheet(args: { title: string }) {
    try {
      const res = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: args.title
          }
        }
      });

      return {
        spreadsheetId: res.data.spreadsheetId || undefined,
        spreadsheetUrl: res.data.spreadsheetUrl || undefined,
        success: true
      };
    } catch (error) {
      console.error("Error creating spreadsheet:", error);
      return { success: false };
    }
  }
}

