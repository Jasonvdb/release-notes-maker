import React, { useEffect, useState } from "react";
import io from 'socket.io-client';
import ReactMarkdown from 'react-markdown'
import template from './template.js';
import example from "./example.js";
import {removeUnusedHeadingsAndNewLines, sorter} from './helpers.js';

const server = process.env.REACT_APP_SERVER_URL;
if (!server) {
  console.error('REACT_APP_SERVER_URL environment variable is not set');
  process.exit(1);
}

const socket = io(server);

var loaded = false;
var notesWithoutSummary = '';

const App = () => {
  const [prompt, setPrompt] = useState(example);
  const [notes, setNotes] = useState(template);
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("");
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (loaded) return;

    socket.on('response', (data) => {
      if (data == '[DONE]') {
        setNotes((prevData) => removeUnusedHeadingsAndNewLines(prevData));
        setStatus("Done! 🎉")
        setIsReady(true);   
        return;
      }
      
      setStatus("Writing... ⏳");
      setIsReady(false);
      
      setSummary((prevData) => prevData + data);
    });
    
    socket.on('connect', () => {
      setStatus('Ready! 🤓');
      setIsReady(true);
    });

    socket.on('disconnect', () => {
      setStatus('Disconnected ❌');
      setIsReady(false);
    });

    loaded = true;
  }, []);

  useEffect(() => {
    const newNotes = notesWithoutSummary.replace('{{summary}}', summary);
    setNotes(newNotes);
  }, [summary]);

  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
  };

  const handlePromptSubmit = async () => {
    const sorted = sorter(prompt);

    //TODO replace all placeholder keys with real content

    let notes = template;
    Object.keys(sorted).forEach((key) => {
      notes = notes.replace('{{' + key + '}}', sorted[key]);
    });

    notesWithoutSummary = notes;
    setNotes(notesWithoutSummary);

    setSummary('');
    setIsReady(false);

    let toSummarise = sorted;
    delete toSummarise.full_changelog;

    socket.emit('message', Object.keys(toSummarise).map((key) => toSummarise[key]).join('\n'));
  };

  return (
    <div style={{padding: 20}}>
      <h1>Release notes maker 4000</h1>
      <p>Paste auto generated release notes</p>
      <textarea style={{height: 200, width: 600}} value={prompt} onChange={handlePromptChange} />
      <br/>
      <button disabled={!isReady} onClick={handlePromptSubmit}>Submit</button>

      <br/><br/><br/><br/>

      <h2>Status: {status}</h2>

      <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
       <div style={{ flex: 1, backgroundColor: '#ddd', padding: 10, marginRight: 10, width: 600, minHeight: 600}}>
          <ReactMarkdown>{notes}</ReactMarkdown>
        </div>

        <div style={{ flex: 1, backgroundColor: '#ddd', padding: 10, marginLeft: 10, width: 700, minHeight: 600}}>
          <pre>{notes}</pre>
        </div>
      </div>  
    </div>
  );
};

export default App;