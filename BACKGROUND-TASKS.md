# Background Tasks Implementation Guide

This document explains what background tasks are and how they can be implemented in the library system.

## What are Background Tasks?

Background tasks are automated processes that run periodically without user interaction. They handle routine maintenance, notifications, and automated workflows.

---

## Recommended Background Tasks for Library System

### 1. Daily Overdue Loan Checks ⭐ **HIGH PRIORITY**

**Purpose:** Automatically mark active loans as overdue when they pass their due date

**Schedule:** Daily at 12:00 AM (midnight)

**Implementation:**
```python
# Call the existing endpoint: POST /loans/mark-overdue
# This endpoint already exists and does:
# - Find all active loans where due_date < today
# - Update status from 'active' to 'overdue'
# - Return list of updated loans
```

**Benefits:**
- Keeps loan status accurate
- No manual admin intervention needed
- Provides data for overdue reports

---

### 2. Email Notifications ⭐ **HIGH PRIORITY**

**A. Due Date Reminders**
- **Schedule:** Daily at 9:00 AM
- **Action:** Send email to users with loans due in 3 days
- **Email Content:**
  - Book title and call number
  - Due date
  - Renewal instructions (if applicable)
  - Consequences of overdue returns

**B. Overdue Notices**
- **Schedule:** Daily at 10:00 AM
- **Action:** Send email to users with overdue loans
- **Email Content:**
  - Book title
  - Days overdue
  - Infraction information
  - Return instructions

**C. Pending Request Notifications (Admin)**
- **Schedule:** Every 2 hours during work hours (8 AM - 6 PM)
- **Action:** Email admins if there are pending loan requests
- **Email Content:**
  - Number of pending requests
  - Link to admin dashboard

**Implementation Requires:**
- Email service (SendGrid, AWS SES, SMTP)
- Email templates
- User email preference settings

---

### 3. Automatic Infraction Management

**A. Reset Infractions**
- **Schedule:** First day of each semester/term
- **Action:** Reset infractions to 0 for users who:
  - Currently have no overdue loans
  - Have infractions_count > 0
- **Benefits:** Fresh start each semester

**B. Blacklist Review**
- **Schedule:** Monthly on 1st
- **Action:** Generate report of blacklisted users for admin review
- **Benefits:** Ensures blacklist is up-to-date

---

### 4. Database Maintenance ⭐ **MEDIUM PRIORITY**

**A. Archive Old Loan Records**
- **Schedule:** Quarterly (every 3 months)
- **Action:** Move loans older than 2 years to archive table
- **Benefits:**
  - Improves query performance
  - Maintains historical data

**B. Clean Expired Tokens**
- **Schedule:** Weekly
- **Action:** Remove expired JWT tokens from any cache/storage
- **Benefits:** Security and cleanup

**C. Update Book Availability Cache**
- **Schedule:** Hourly
- **Action:** Pre-calculate and cache book availability statistics
- **Benefits:** Faster API responses

---

### 5. Reports & Statistics ⭐ **MEDIUM PRIORITY**

**A. Monthly Library Report**
- **Schedule:** 1st of each month at 6:00 AM
- **Action:** Generate comprehensive report:
  - Total loans for the month
  - Most borrowed books
  - Top borrowers
  - Overdue statistics
  - Faculty-wise usage
- **Delivery:** Email to library administrators

**B. Trending Books Update**
- **Schedule:** Weekly on Sunday
- **Action:** Calculate and cache:
  - Most borrowed books in last 30 days
  - Most reserved books
- **Benefits:** Powers dashboard recommendations

---

### 6. Data Validation & Cleanup

**A. Orphaned Records Check**
- **Schedule:** Weekly
- **Action:** Find and report:
  - Loans referencing deleted users/copies
  - Enrollments for deleted courses
  - Course books for deleted books
- **Output:** Report for admin review

**B. Status Consistency Check**
- **Schedule:** Daily at 3:00 AM
- **Action:** Verify:
  - Book copy status matches loan status
  - All returned loans have return_date set
  - Approve/reject dates are consistent
- **Fix:** Auto-correct or flag for admin

---

## Implementation Options

### Option 1: APScheduler (Python) ⭐ **RECOMMENDED**

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime

scheduler = AsyncIOScheduler()

# Daily overdue check at midnight
@scheduler.scheduled_job('cron', hour=0, minute=0)
async def mark_overdue():
    # Call POST /loans/mark-overdue
    pass

# Email reminders at 9 AM
@scheduler.scheduled_job('cron', hour=9, minute=0)
async def send_reminders():
    # Get loans due in 3 days
    # Send emails
    pass

scheduler.start()
```

**Pros:**
- Python-native, integrates with FastAPI
- Flexible scheduling (cron, interval, date)
- Easy to test and debug

**Cons:**
- Runs within app process
- Stops if app restarts

---

### Option 2: Celery + Redis

```python
from celery import Celery

celery_app = Celery('library', broker='redis://localhost:6379')

@celery_app.task
def mark_overdue_loans():
    # Call API endpoint
    pass

# Schedule in celerybeat
celery_app.conf.beat_schedule = {
    'mark-overdue-daily': {
        'task': 'tasks.mark_overdue_loans',
        'schedule': crontab(hour=0, minute=0),
    },
}
```

**Pros:**
- Distributed task queue
- Survives app restarts
- Production-grade

**Cons:**
- Requires Redis/RabbitMQ
- More complex setup

---

### Option 3: System Cron (Linux/Unix)

```bash
# crontab -e
0 0 * * * curl -X POST http://localhost:8000/loans/mark-overdue
0 9 * * * python /path/to/send_reminders.py
```

**Pros:**
- System-level reliability
- Independent of app
- Simple for single-server

**Cons:**
- OS-dependent
- Less flexible
- Harder to monitor

---

### Option 4: Cloud-Based (AWS/GCP)

**AWS EventBridge + Lambda:**
- Schedule Lambda functions to call API endpoints
- Serverless, no infrastructure management

**Google Cloud Scheduler:**
- HTTP triggers to call endpoints
- Pay-per-use pricing

**Pros:**
- Scalable and reliable
- No server maintenance

**Cons:**
- Cloud vendor lock-in
- Additional costs

---

## Quick Start Implementation

### Phase 1: Critical (Week 1)
1. ✅ Daily overdue check (already have endpoint!)
2. Email service setup
3. Due date reminders

### Phase 2: Important (Week 2-3)
4. Overdue notices
5. Monthly reports
6. Admin notifications

### Phase 3: Nice-to-Have (Week 4+)
7. Database archiving
8. Infraction reset
9. Trending books
10. Data validation

---

## Code Example: Complete APScheduler Setup

```python
# backend/src/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import httpx
from datetime import datetime, timedelta

class LibraryScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.api_base = "http://localhost:8000"
    
    async def mark_overdue_task(self):
        """Daily at midnight - mark overdue loans"""
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.api_base}/loans/mark-overdue")
            print(f"Marked overdue: {len(response.json())} loans")
    
    async def send_reminder_emails(self):
        """Daily at 9 AM - send due date reminders"""
        # Get loans due in 3 days
        due_date = (datetime.now() + timedelta(days=3)).date()
        async with httpx.AsyncClient() as client:
            # Fetch loans
            response = await client.get(f"{self.api_base}/loans/...")
            # Send emails (implement email logic)
            pass
    
    def start(self):
        """Register all scheduled tasks"""
        # Midnight: Mark overdue
        self.scheduler.add_job(
            self.mark_overdue_task,
            CronTrigger(hour=0, minute=0),
            id='mark_overdue',
            name='Mark overdue loans'
        )
        
        # 9 AM: Send reminders
        self.scheduler.add_job(
            self.send_reminder_emails,
            CronTrigger(hour=9, minute=0),
            id='send_reminders',
            name='Send due date reminders'
        )
        
        self.scheduler.start()
        print("Scheduler started!")
    
    def stop(self):
        self.scheduler.shutdown()

# In main.py:
from .scheduler import LibraryScheduler

@app.on_event("startup")
async def startup_event():
    scheduler = LibraryScheduler()
    scheduler.start()
```

---

## Monitoring & Logging

**Essential Logging:**
```python
import logging

logger = logging.getLogger("library_scheduler")

@scheduler.scheduled_job('cron', hour=0, minute=0)
async def mark_overdue():
    logger.info("Starting overdue check...")
    try:
        result = await mark_overdue_loans()
        logger.info(f"✅ Marked {len(result)} loans overdue")
    except Exception as e:
        logger.error(f"❌ Failed: {e}")
        # Send alert to admin
```

**Metrics to Track:**
- Task execution time
- Success/failure rate
- Number of items processed
- Errors and exceptions

---

## Next Steps

1. **Choose implementation**: APScheduler recommended for simplicity
2. **Setup email service**: SendGrid/AWS SES
3. **Implement Phase 1 tasks**: Overdue checks + reminders
4. **Add monitoring**: Logging and error alerts
5. **Test thoroughly**: Use test dates/times
6. **Deploy**: Set up in production environment

