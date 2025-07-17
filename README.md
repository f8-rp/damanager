# DAManager

#### A Discord account manager that automates receiving replies on Discord using OAuth tokens.
---

## Features

- **Auto Ban Detection:**  
  Detects if your account gets banned from a server and automatically switches to another account's OAuth token to continue operation without interruption.

- **Auto Message Send:**  
  Sends messages at specified intervals in a given Discord channel, assuming the account is a member of the server.

- **Auto Reply:**  
  Automatically replies to any direct messages (DMs) with custom message(s).

- **Custom Configs:**  
  Download and store configurations locally as JSON files, which include OAuth token, channel ID, interval, and messages.

---
![APP SCREENIE :D](screenshot1.png)
---
## Getting Started

### For macOS

1. Clone the repository anywhere you like:
   ```bash
   git clone https://github.com/YOUR_USERNAME/damanager.git
   cd damanager``
2. Run the start script to launch both backend and frontend:
    ```bash
    ./startserver.sh
    ```
    - This will open the web app in your default browser.
    - The URL will also be printed in the terminal.

**Note:**  
If you get a permission error running the `.sh` file, run this command in your terminal first (drag the `.sh` file into terminal to auto-fill the path):
    ```bash
    chmod +x /path/to/startserver.sh
    ```

### For Windows

1. Clone the repository:
    ```powershell
    git clone https://github.com/YOUR_USERNAME/damanager.git
    cd damanager
    ```

2. Open two terminals or PowerShell windows.

3. In the first terminal, start the frontend:
    ```powershell
    cd autoserverbot
    npm run dev
    ```
    - Open the URL displayed in your preferred browser.

4. In the second terminal, start the backend:
    ```powershell
    cd requesttestingdc
    npm start
    ```

---

## Usage

**Note:** Follow getting started to run the server.
### INSTRUCTIONS WIP for now

---

## License

[Add license info here]

---

*This README provides a high-level overview of damanager’s functionality and setup.*
