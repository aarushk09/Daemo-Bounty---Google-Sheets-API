import "reflect-metadata";
import 'dotenv/config';
import { DaemoBuilder, DaemoHostedConnection } from 'daemo-engine';
import { DriveService } from './services/DriveFunctions';
import { SheetService } from './services/SheetFunctions';

async function main() {
  // Check for required environment variables
  const requiredEnvVars = [
    'DAEMO_AGENT_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`❌ Error: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error(`Please check your .env file.`);
    process.exit(1);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN!;

  const driveService = new DriveService(clientId, clientSecret, refreshToken);
  const sheetService = new SheetService(clientId, clientSecret, refreshToken);

  const sessionData = new DaemoBuilder()
    .withServiceName("GoogleDataAnalystAgent")
    .registerService(driveService)
    .registerService(sheetService)
    .build();

  const connection = new DaemoHostedConnection(
    { 
      agentApiKey: process.env.DAEMO_AGENT_API_KEY!, 
      daemoGatewayUrl: "https://engine.daemo.ai:50052/"
    },
    sessionData
  );

  await connection.start();
  console.log("🚀 Google Data Analyst Agent online!");
  console.log("📊 Ready to analyze spreadsheets and organize files.");
}

main().catch(console.error);

