# CORS & Network Errors - Backend Fix Required

## 🚨 Current Issues (From Console)

Looking at your console errors:

1. **CORS Policy Errors**:
   ```
   Access to XMLHttpRequest at 'http://localhost:3000/users/...' from origin 
   'http://localhost:3000' has been blocked by CORS policy
   ```

2. **Network Errors**:
   ```
   GET http://localhost:3000/users?skip=0&limit=100 net::ERR_FAILED 500
   No response from server. Please check your connection.
   ```

3. **Failed to load users** (multiple endpoints)

---

## 🔧 Backend CORS Configuration

Your backend needs to allow CORS from the frontend. Here's how to fix it:

### Python/FastAPI Backend:

```python
# FILE: backend/main.py or backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server (if used)
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers (Authorization, Content-Type, etc.)
)

# Rest of your app...
```

### If you're using a different backend:

**Express.js (Node.js)**:
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

**Django**:
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True
```

---

## 🔍 API Endpoint Issues

The frontend is calling:
- `http://localhost:3000/users?skip=0&limit=100`

But your **backend is probably on port 8000**, not 3000!

### Fix in Frontend:

Check [config.js](src/api/config.js):

```javascript
// Current (probably wrong):
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Should be:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

If config.js already has `:8000`, then your **backend isn't running**!

---

## ✅ Checklist

### Backend:
- [ ] Backend server is running (`python main.py` or `uvicorn main:app`)
- [ ] Backend is on port 8000 (or update frontend config.js)
- [ ] CORS middleware is added to backend
- [ ] Backend allows `http://localhost:3000` origin
- [ ] Backend endpoints exist:
  - `GET /users?skip=0&limit=100`
  - `GET /users/me/dashboard`
  - `GET /books/with-stats`

### Frontend:
- [ ] config.js has correct backend URL
- [ ] React dev server is on port 3000
- [ ] Browser console shows actual errors (not cached)

---

## 🧪 How to Test

### 1. Check Backend is Running:
```bash
# In backend terminal
curl http://localhost:8000/docs
# Should return API documentation page
```

### 2. Test CORS:
```bash
# Test from command line
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS \
     http://localhost:8000/users

# Should return CORS headers:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Methods: *
```

### 3. Check Frontend Config:
Open browser console and type:
```javascript
console.log(import.meta.env.VITE_API_URL)
// Should show: http://localhost:8000
```

---

## 🚀 Quick Backend CORS Fix

If you have FastAPI backend, add this to your main.py:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ ADD THIS IMMEDIATELY AFTER app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development only!)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your existing routes...
@app.get("/")
def read_root():
    return {"message": "Hello World"}
```

**Restart your backend** after adding this!

---

## 🔥 Common Mistakes

### 1. Backend Not Running
```bash
# Check if backend is running
# Windows:
netstat -ano | findstr :8000

# Should show something like:
# TCP    0.0.0.0:8000    0.0.0.0:0    LISTENING    12345
```

### 2. Wrong Port
Frontend calls `:3000` but backend is on `:8000`
- Fix: Update config.js to use `:8000`

### 3. CORS Not Enabled
Backend doesn't send CORS headers
- Fix: Add CORSMiddleware to backend

### 4. Endpoints Don't Exist
`/users?skip=0&limit=100` not implemented
- Fix: Check backend routes with `/docs`

---

## 📊 Error Translation

| Console Error | What It Means | Fix |
|---------------|---------------|-----|
| `net::ERR_FAILED 500` | Backend crashed | Check backend logs |
| `CORS policy: No 'Access-Control-Allow-Origin'` | CORS not enabled | Add CORSMiddleware |
| `No response from server` | Backend not running | Start backend |
| `404 Not Found` | Endpoint doesn't exist | Check backend routes |
| `Failed to fetch` | Network/CORS issue | Check both servers running |

---

## 🎯 Action Items

1. **Start your backend server** (if not running)
2. **Add CORS middleware** to backend main.py
3. **Verify backend is on port 8000**
4. **Restart both frontend and backend**
5. **Clear browser cache** (Ctrl+Shift+R)
6. **Check console again** - errors should be gone

---

## 💡 Development vs Production

**Development** (now):
```python
allow_origins=["*"]  # Allow all - easy for testing
```

**Production** (later):
```python
allow_origins=[
    "https://yourdomain.com",  # Only your real domain
]
```

---

**Next Steps:**
1. Add CORS to backend
2. Restart backend
3. Refresh browser
4. Tell me what the console shows now!
