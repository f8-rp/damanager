# DAManager 🚀

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

**Channel ID**: To get channel ID, right click channel and press Copy Channel ID:
![copychannel id screenshot for speds](https://cdn.discordapp.com/attachments/1380420506896826459/1395554807007416450/Screenshot_2025-07-17_at_5.56.28_PM.png?ex=687adf32&is=68798db2&hm=2e0b147039fd9c4d0e1c27d387d209ea9c1e7cd054bfd3605eb16ff4f6ffb7c5&)

**Server Message:** 1 message max, just type whatever you want (random messages not supported YET)

**Interval (seconds):** how much time between sending messages in given channel ID

**DM Reply message (IMPORTANT):** Split messages using |. messages split by | are given 2 second cooldowns between each send.
Example:
```
Hello! | How are you! | I am doing well today!
```
Leads to:
(2 seconds between each message)

![examplescreenshot](https://cdn.discordapp.com/attachments/1380420506896826459/1395555860565983403/Screenshot_2025-07-17_at_6.00.42_PM.png?ex=687ae02d&is=68798ead&hm=fd5fc4be9fd82a1085ca62d8dba82150e8b36c434b65fdb5f29b4ee940e2e76a&)


**Note**: To increase the delay before sending a message upon receiving a DM, simply add multiple ``|`` characters at the beginning of your prompt
Example:
```
| | | Hello! | How are you! | I am doing well today!
```
Gives 6 seconds before sending Hello!

**TO ADD OAUTH IDS (IMPORTANT)**
Click the cog icon at the top right of configuration, add them as many as you want (please note, discord MIGHT flag you for using tokens, which will lock you out of the account and OAUTH token :/)

**LOADING/SAVING configs**
Saving config will download json to your device. To load that same config just select it in file explorer when you click Load button.

---

### give me money pls
LTC : ltc1qw4v2893pw0c6tgtgkyvksykph3ljgf4677ufke

### MIGHT ADD LATER/TODO
- random message selection from a list
- better prompt syntax and handling
- make ``.bat`` or ``.cmd`` file for windows users to set up server easily

# contact @ vlam69 for commissions or paid requests 😛
