# Google Data Analyst Agent

This Daemo agent acts as an AI data analyst. It can search your Google Drive for spreadsheets, read their content, answer questions about the data, and update the sheets with new information.

## Features

- **Search Files**: Find relevant spreadsheets or documents in your Drive.
- **Read Sheets**: Extract data from Google Sheets to answer questions.
- **Update Sheets**: Write analysis results or new data back into spreadsheets.
- **Append Data**: Add new rows to existing datasets.
- **Create Sheets**: Generate new spreadsheets for reports.
- **Manage Files**: Create folders and move files for organization.

## Setup

1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd google-sheets-data-analyst
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory (copied from `src/env.example`) and fill in your credentials:
    ```env
    DAEMO_AGENT_API_KEY=your_daemo_key
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_REFRESH_TOKEN=your_google_refresh_token
    ```

### Obtaining Google Credentials

To allow the agent to access your Google Sheets and Drive, you need a Refresh Token with the appropriate scopes.

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a project and enable the **Google Drive API** and **Google Sheets API**.
3.  Create OAuth 2.0 credentials (Client ID and Secret).
4.  Use the OAuth 2.0 Playground (or a script) to authorize the app with the following scopes:
    - `https://www.googleapis.com/auth/drive` (Full access to Drive files)
    - `https://www.googleapis.com/auth/spreadsheets` (Read/Write access to Sheets)
5.  Exchange the authorization code for a **Refresh Token**.

## Usage

Start the agent:

```bash
npm start
```

The agent will connect to the Daemo Engine and await instructions. You can interact with it via the Daemo Playground to ask questions like:

- "Find the 'Sales Report' spreadsheet and tell me the total revenue."
- "Create a new sheet called 'Analysis' and write these summary stats..."
- "Append this new transaction to the 'Expenses' sheet."

