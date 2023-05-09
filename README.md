# release-notes-maker
Create formatted release notes with GPT summary from auto generated GitHub release notes

http://release-notes-maker.surge.sh/

### Server setup
```bash
cd server
npm install 
PORT=3210 API_KEY=sk-123 CORS_ORIGIN=http://localhost:3000 node index.js
```

### Web setup
```bash
cd web
npm install 
REACT_APP_SERVER_URL=http://localhost:3210 npm start
```

![Screenshot 2023-05-09 at 22 08 54](https://github.com/Jasonvdb/release-notes-maker/assets/5300488/7a645023-3a52-45da-84e0-a788133657bf)
