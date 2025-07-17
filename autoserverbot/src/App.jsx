import { useState, useEffect, useRef } from 'react'
import {
  FaPlay,
  FaStop,
  FaCheckCircle,
  FaTimesCircle,
  FaCog,
  FaRocket,
  FaChartLine,
  FaUsers,
  FaEnvelope,
  FaReply,
  FaClock,
  FaFire,
  FaPlus,
  FaTimes,
  FaSave,
  FaTrash,
  FaDiscord,
  FaUpload,
  FaHammer
} from 'react-icons/fa'

function App() {
  const [status, setStatus] = useState("Disconnected")
  const [intervalSec, setIntervalSec] = useState(60)
  const [channelId, setChannelId] = useState("")
  const [serverMessage, setServerMessage] = useState("")
  const [dmMessage, setDmMessage] = useState("")
  const [messagesSent, setMessagesSent] = useState(0)
  const [dmsReceived, setDmsReceived] = useState(0)
  const [runningTime, setRunningTime] = useState(0)
  const [logs, setLogs] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [oauthIds, setOauthIds] = useState([''])
  const [bans, setBans] = useState(0);
  const hasSentSuccessfully = useRef(false);

  const timerRef = useRef(null)
  const uptimeRef = useRef(null)
  const fileInputRef = useRef(null)

useEffect(() => {
  if (!isRunning) return;

  const fetchStats = () => {
    fetch('http://localhost:3001/stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then(data => {
        addLog(`Fetching stats from backend...`);
        if (typeof data.dmsReceived === 'number') setDmsReceived(data.dmsReceived);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
      });
  };

  fetchStats(); // fetch immediately on start
  const intervalId = setInterval(fetchStats, 10000); // every 10 seconds

  return () => clearInterval(intervalId);
}, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      uptimeRef.current = setInterval(() => {
        setRunningTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(uptimeRef.current)
    }
    return () => clearInterval(uptimeRef.current)
  }, [isRunning])

  useEffect(() => {
  if (!isRunning) return;

  // Find first valid OAuth token
  const token = oauthIds.find(id => id.trim());
  if (!token) {
    console.warn("No valid OAuth token available to send messages.");
    return;
  }
  if (!channelId) {
    console.warn("No channel ID set for sending messages.");
    return;
  }

  // Send message immediately once
  sendMessage(token, channelId, serverMessage);
  setMessagesSent(prev => prev + 1);

  // Then send message every intervalSec seconds
  const interval = setInterval(() => {
    sendMessage(token, channelId, serverMessage);
    setMessagesSent(prev => prev + 1);
  }, intervalSec * 1000);

  // Cleanup interval on stop or dependencies change
  return () => clearInterval(interval);
}, [isRunning, intervalSec, channelId, serverMessage, oauthIds]);


function handleBanDetected() {
  console.log("Ban detected — cycling to next OAuth token.");

  setIsRunning(false); // stop the bot

  setOauthIds(prevIds => {
    if (prevIds.length <= 1) {
      alert("All OAuth accounts have been banned or used up.");
      return ['']; // or [] depending on your logic
    }

    const newIds = prevIds.slice(1);

    // Restart the bot with next token after a small delay to ensure state updates
    setTimeout(() => {
      const nextToken = newIds[0].trim();
      if (nextToken) {
        startBotWithToken(nextToken);
      }
    }, 100);

    return newIds;
  });
}

function startBotWithToken(token) {
  const replyMessage = dmMessage;

  fetch('http://localhost:3001/startbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, replyMessage })
  })
    .then(res => {
      if (!res.ok) throw new Error(`Error: ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      addLog("Bot restarted with next OAuth token after ban.");
      setStatus("Connected");
      setIsRunning(true);
      hasSentSuccessfully.current = false; // reset success flag
    })
    .catch(err => {
      addLog("Failed to restart bot after ban: " + err.message);
    });
}

  function addLog(msg) {
    setLogs(prev => [msg, ...prev])
  }

  function saveAccountSettings() {
    try {
      const validIds = oauthIds.filter(id => id.trim())
      if (validIds.length === 0) {
        alert("Please enter at least one valid OAuth ID.")
        return
      }
      setOauthIds(validIds)
      setShowAccountSettings(false) // Close modal after successful save
      addLog("Account settings saved successfully.")
    } catch (error) {
      alert("Error saving account settings: " + error.message)
    }
  }

  function saveConfiguration() {
    const config = {
      interval: intervalSec,
      replymsg: dmMessage,
      servermsg: serverMessage,
      channelid: channelId,
      oauthTokens: oauthIds.filter(id => id.trim()) // only non-empty IDs
    }

    const configStr = JSON.stringify(config, null, 2) // pretty-print JSON

    const blob = new Blob([configStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "config.json"
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function loadConfiguration() {
    fileInputRef.current.click()
  }

  function sendMessage(token, channelId, message) {
  const url = `https://discord.com/api/v8/channels/${channelId}/messages`;
  const data = { content: message };

  fetch(url, {
    method: "POST",
    headers: {
      "Authorization": token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (response.ok) {
        hasSentSuccessfully.current = true;
        addLog(`Message sent successfully to channel ${channelId}.`);
      } else {
        if (hasSentSuccessfully.current) {
          setBans(prev => prev + 1);
          console.log("Detected ban due to send failure.");
          handleBanDetected();
        }
      }
      return response.json();
    })
    .then(json => {
      console.log(json);
    })
    .catch(error => {
      if (hasSentSuccessfully.current) {
        setBans(prev => prev + 1);
        console.log("Detected ban due to fetch error:", error);
        addLog(`Ban, mute, or kick detected. Switching accounts (hopefully)...`);
        handleBanDetected();
      }
      console.error("Error:", error);
    });
}

  function startBot() {
    hasSentSuccessfully.current = false;
  if (!dmMessage) {
    alert("Please enter a DM reply message.");
    return;
  }
  if (oauthIds.length === 0 || !oauthIds.find(id => id.trim())) {
    alert("Please enter at least one valid OAuth token.");
    return;
  }

  const token = oauthIds.find(id => id.trim());
  const replyMessage = dmMessage;

  fetch('http://localhost:3001/startbot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token, replyMessage })
  })
    .then(res => {
      if (!res.ok) throw new Error(`Error: ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      addLog("Bot started via backend.");
      setStatus("Connected");
      setIsRunning(true);
    })
    .catch(err => {
      alert("Failed to start bot: " + err.message);
      addLog("Failed to start bot: " + err.message);
    });
}

function stopBot() {
  hasSentSuccessfully.current = false;
  fetch('http://localhost:3001/stopbot', {
    method: 'POST'
  })
    .then(res => {
      if (!res.ok) throw new Error(`Error: ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      addLog("Bot stopped via backend.");
      setStatus("Disconnected");
      setIsRunning(false);
    })
    .catch(err => {
      alert("Failed to stop bot: " + err.message);
      addLog("Failed to stop bot: " + err.message);
    });
}


  function handleFileLoad(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = function (e) {
      try {
        const config = JSON.parse(e.target.result)

        if (config.channelid) setChannelId(config.channelid)
        if (config.servermsg) setServerMessage(config.servermsg)
        if (config.replymsg) setDmMessage(config.replymsg)
        if (config.interval) setIntervalSec(config.interval)
        if (Array.isArray(config.oauthTokens) && config.oauthTokens.length > 0) {
          setOauthIds(config.oauthTokens)
        } else {
          setOauthIds(['']) // fallback to empty input if no tokens found
        }

        addLog("Configuration loaded successfully")
        alert("Configuration loaded successfully!")
      } catch (error) {
        addLog("Error loading configuration: Invalid JSON format")
        alert("Error loading configuration: Invalid JSON format")
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  function formatTime(sec) {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${h}h ${m}m ${s}s`
  }

  function addOauthField() {
    setOauthIds([...oauthIds, ''])
  }

  function removeOauthField(index) {
    if (oauthIds.length > 1) {
      setOauthIds(oauthIds.filter((_, i) => i !== index))
    }
  }

  function updateOauthId(index, value) {
    const newIds = [...oauthIds]
    newIds[index] = value
    setOauthIds(newIds)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse top-1/4 left-1/4"></div>
        <div className="absolute w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse top-3/4 right-1/4 animation-delay-1000"></div>
        <div className="absolute w-64 h-64 bg-indigo-500/25 rounded-full blur-3xl animate-pulse top-1/2 right-1/3 animation-delay-2000"></div>

        <div className="absolute w-2 h-2 bg-blue-400/40 rounded-full animate-ping top-1/5 left-1/5"></div>
        <div className="absolute w-1 h-1 bg-cyan-400/40 rounded-full animate-ping top-3/5 left-3/5 animation-delay-1000"></div>
        <div className="absolute w-1.5 h-1.5 bg-indigo-400/40 rounded-full animate-ping top-4/5 left-4/5 animation-delay-2000"></div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileLoad}
        className="hidden"
      />

      {/* Top navigation */}
      <div className="relative z-10 flex justify-center pt-6 px-6">
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl px-8 py-4 shadow-2xl">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <FaDiscord className="text-blue-400 text-xl animate-pulse" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Discord Account Manager
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1 bg-black/30 rounded-full">
                {status === "Connected" ? (
                  <>
                    <FaCheckCircle className="text-green-400 animate-pulse" />
                    <span className="text-green-400 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-red-400" />
                    <span className="text-red-400 font-medium">Disconnected</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full">
                <FaClock className="text-blue-400" />
                <span className="text-blue-400 font-medium">{intervalSec}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Config panel */}
          <div className="lg:col-span-1">
            <div className={`bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl ${showAccountSettings ? '' : 'transform hover:scale-105 transition-all duration-500 hover:shadow-blue-500/30 hover:bg-black/40'} group`}>
              <div className="flex items-center gap-3 mb-6">
                <FaCog className={`text-blue-400 text-xl ${showAccountSettings ? '' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Configuration
                </h2>
                <button
                  onClick={() => setShowAccountSettings(true)}
                  className={`ml-auto p-2 rounded-lg bg-black/50 border border-gray-600/50 ${showAccountSettings ? '' : 'hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300'} group/settings`}
                  title="Account Settings"
                >
                  <FaCog className={`text-gray-400 ${showAccountSettings ? '' : 'group-hover/settings:text-blue-400 group-hover/settings:rotate-90 transition-all duration-300'}`} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="group/input">
                  <label className={`block text-sm font-medium text-gray-300 mb-2 ${showAccountSettings ? '' : 'group-hover/input:text-blue-400 transition-colors'}`}>
                    Channel ID
                  </label>
                  <input
                    type="text"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    className={`w-full bg-black/50 border border-gray-600/50 rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${showAccountSettings ? '' : 'transition-all duration-300 hover:bg-black/60 hover:border-blue-500/50'}`}
                    placeholder="Enter channel ID..."
                  />
                </div>

                <div className="group/input">
                  <label className={`block text-sm font-medium text-gray-300 mb-2 ${showAccountSettings ? '' : 'group-hover/input:text-blue-400 transition-colors'}`}>
                    Server Message
                  </label>
                  <textarea
                    value={serverMessage}
                    onChange={(e) => setServerMessage(e.target.value)}
                    rows={3}
                    className={`w-full bg-black/50 border border-gray-600/50 rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${showAccountSettings ? '' : 'transition-all duration-300 hover:bg-black/60 hover:border-blue-500/50'}`}
                    placeholder="Enter your server message..."
                  />
                </div>

                <div className="group/input">
                  <label className={`block text-sm font-medium text-gray-300 mb-2 ${showAccountSettings ? '' : 'group-hover/input:text-blue-400 transition-colors'}`}>
                    DM Reply Message
                  </label>
                  <textarea
                    value={dmMessage}
                    onChange={(e) => setDmMessage(e.target.value)}
                    rows={3}
                    className={`w-full bg-black/50 border border-gray-600/50 rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${showAccountSettings ? '' : 'transition-all duration-300 hover:bg-black/60 hover:border-blue-500/50'}`}
                    placeholder="Enter your DM reply message..."
                  />
                </div>

                <div className="group/input">
                  <label className={`block text-sm font-medium text-gray-300 mb-2 ${showAccountSettings ? '' : 'group-hover/input:text-blue-400 transition-colors'}`}>
                    Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.target.value))}
                    className={`w-full bg-black/50 border border-gray-600/50 rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${showAccountSettings ? '' : 'transition-all duration-300 hover:bg-black/60 hover:border-blue-500/50'}`}
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={startBot}
                  disabled={isRunning}
                  className={`flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${showAccountSettings ? '' : 'hover:from-green-600 hover:to-emerald-600 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105'}`}
                >
                  <FaPlay className="text-sm" />
                  Start Bot
                </button>
                <button
                  onClick={stopBot}
                  disabled={!isRunning}
                  className={`flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${showAccountSettings ? '' : 'hover:from-red-600 hover:to-rose-600 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 transform hover:scale-105'}`}
                >
                  <FaStop className="text-sm" />
                  Stop Bot
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  onClick={saveConfiguration}
                  className={`flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold ${showAccountSettings ? '' : 'hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 transform hover:scale-105'}`}
                >
                  <FaSave className="text-sm" />
                  Save
                </button>
                <button
                  onClick={loadConfiguration}
                  className={`flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold ${showAccountSettings ? '' : 'hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105'}`}
                >
                  <FaUpload className="text-sm" />
                  Load
                </button>
              </div>
            </div>
          </div>

          {/* Stats & logs */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl ${showAccountSettings ? '' : 'hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105'} group`}>
                <div className="flex items-center gap-3 mb-2">
                  <FaEnvelope className={`text-blue-400 text-xl ${showAccountSettings ? '' : 'group-hover:scale-110 transition-transform duration-300'}`} />
                  <span className="text-gray-300 text-sm font-medium">Messages</span>
                </div>
                <div className="text-2xl font-bold text-white">{messagesSent}</div>
              </div>

              <div className={`bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl ${showAccountSettings ? '' : 'hover:shadow-green-500/20 transition-all duration-300 hover:scale-105'} group`}>
                <div className="flex items-center gap-3 mb-2">
                  <FaUsers className={`text-green-400 text-xl ${showAccountSettings ? '' : 'group-hover:scale-110 transition-transform duration-300'}`} />
                  <span className="text-gray-300 text-sm font-medium">DMs Received</span>
                </div>
                <div className="text-2xl font-bold text-white">{dmsReceived}</div>
              </div>

              <div className={`bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl ${showAccountSettings ? '' : 'hover:shadow-yellow-500/20 transition-all duration-300 hover:scale-105'} group`}>
                <div className="flex items-center gap-3 mb-2">
                  <FaHammer className={`text-yellow-400 text-xl ${showAccountSettings ? '' : 'group-hover:scale-110 transition-transform duration-300'}`} />
                  <span className="text-gray-300 text-sm font-medium">Bans</span>
                </div>
                <div className="text-2xl font-bold text-white">{bans}</div>
              </div>

              <div className={`bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl ${showAccountSettings ? '' : 'hover:shadow-red-500/20 transition-all duration-300 hover:scale-105'} group`}>
                <div className="flex items-center gap-3 mb-2">
                  <FaFire className={`text-red-400 text-xl ${showAccountSettings ? '' : 'group-hover:scale-110 transition-transform duration-300'}`} />
                  <span className="text-gray-300 text-sm font-medium">Uptime</span>
                </div>
                <div className="text-lg font-bold text-white">{formatTime(runningTime)}</div>
              </div>
            </div>

            <div className={`bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl group`}>
              <div className="flex items-center gap-3 mb-6">
                <FaChartLine className={`text-blue-400 text-xl ${showAccountSettings ? '' : 'group-hover:scale-110 transition-transform duration-300'}`} />
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Activity Log
                </h2>
              </div>
              <div className="bg-black/50 rounded-2xl p-6 h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-transparent">
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">No activity yet. Start the bot to see logs.</div>
                  ) : (
                    logs.map((log, index) => (
                      <div
                        key={index}
                        className={`text-sm text-gray-300 p-3 bg-black/30 rounded-lg border border-gray-700/50 flex items-center gap-3 ${showAccountSettings ? '' : 'hover:bg-black/50 hover:border-blue-500/30 transition-all duration-300 transform hover:scale-[1.02]'}`}
                      >
                        <div className="w-1 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="flex-1">{log}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account settings modal */}
      {showAccountSettings && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transform animate-in fade-in duration-300">
    <div className="bg-black/90  border border-white/20 rounded-3xl p-8 max-w-2xl w-full shadow-2xl transform animate-in fade-in duration-300"></div>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 border border-white/20 rounded-3xl p-8 max-w-2xl w-full shadow-2xl transform animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <FaCog className="text-blue-400 text-2xl animate-spin-slow" />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Account Settings
                </h3>
              </div>
              <button
                onClick={() => setShowAccountSettings(false)}
                className="p-2 rounded-lg bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 transition-all duration-300 group"
              >
                <FaTimes className="text-red-400 group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-medium text-gray-300">OAuth IDs</label>
                  <button
                    onClick={addOauthField}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-xl hover:bg-blue-500/30 transition-all duration-300 group"
                  >
                    <FaPlus className="text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-blue-400 font-medium">Add OAuth ID</span>
                  </button>
                </div>
                <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-transparent">
                  {oauthIds.map((id, index) => (
                    <div key={index} className="flex items-center gap-3 group/oauth">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={id}
                          onChange={(e) => updateOauthId(index, e.target.value)}
                          placeholder={`OAuth ID ${index + 1}`}
                          className="w-full bg-black/50 border border-gray-600/50 rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-black/60 hover:border-blue-500/50"
                        />
                      </div>
                      {oauthIds.length > 1 && (
                        <button
                          onClick={() => removeOauthField(index)}
                          className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 transition-all duration-300 opacity-0 group-hover/oauth:opacity-100"
                        >
                          <FaTrash className="text-red-400 hover:scale-110 transition-transform duration-300" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t border-gray-700/50">
                <button
                  onClick={saveAccountSettings}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
                >
                  <FaSave className="text-sm" />
                  Save OAuth IDs
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      <style jsx>{`
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.5); border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.8); }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-in { animation: fadeIn 0.3s ease-out; }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}

export default App