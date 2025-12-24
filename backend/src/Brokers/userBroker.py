import asyncio
from supabase import Client
from typing import Optional
from uuid import UUID

class UserBroker:
    def __init__(self, client: Client):
        self.client = client

    async def SelectAllUsers(self, skip: int = 0, limit: int = 10) -> list[dict]:
        def _fetch():
            # Fetch users with loan counts using aggregation
            return self.client.table("users").select(
                "*,"
                "loans!left(id, status)"
            ).range(skip, skip + limit - 1).execute()
        response = await asyncio.to_thread(_fetch)
        
        # Calculate loan counts for each user
        users = []
        for user in response.data:
            loans = user.pop('loans', [])
            active_count = sum(1 for loan in loans if loan.get('status') in ['pending', 'pending_pickup', 'active'])
            total_count = len(loans)
            
            users.append({
                **user,
                'active_loans_count': active_count,
                'total_loans_count': total_count
            })
        
        return users
    
    async def SelectUserById(self, user_id: UUID) -> Optional[dict]:
        def _fetch():
            return self.client.table("users").select("*").eq("id", str(user_id)).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None
    
    async def SelectUserByEmail(self, email: str) -> Optional[dict]:
        """Get a user by email"""
        def _fetch():
            return self.client.table("users").select("*").eq("email", email).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None         
    async def SelectUserByUniversityId(self, university_id: str) -> Optional[dict]:
        """Get a user by university ID"""
        def _fetch():
            return self.client.table("users").select("*").eq("university_id", university_id).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None

    async def InsertUser(self, user_data: dict) -> dict:
        def _insert():
            return self.client.table("users").insert(user_data).execute()
        return (await asyncio.to_thread(_insert)).data[0]
    
    async def UpdateUser(self, user_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a user by ID"""
        def _update():
            return self.client.table("users").update(update_data).eq("id", str(user_id)).execute()
        response = await asyncio.to_thread(_update)
        return response.data[0] if response.data else None
    
    async def DeleteUser(self, user_id: UUID) -> bool:
        def _delete():
            return self.client.table("users").delete().eq("id", str(user_id)).execute()
        response = await asyncio.to_thread(_delete)
        return len(response.data) > 0
    
    async def SearchUsers(self, query: str) -> list[dict]:
        """Search users by name, email, or university ID (case-insensitive)"""
        def _search():
            return self.client.table("users").select("*").or_(
                f"full_name.ilike.%{query}%,"
                f"email.ilike.%{query}%,"
                f"university_id.ilike.%{query}%"
            ).execute()
        
        response = await asyncio.to_thread(_search)
        return response.data if response.data else []
    
    async def SelectUserDashboardStats(self, user_id: UUID) -> dict:
        """Get user dashboard statistics efficiently"""
        def _fetch_active_loans():
            return self.client.table("loans").select("id", count="exact").eq("user_id", str(user_id)).eq("status", "active").execute()
        
        def _fetch_total_loans():
            return self.client.table("loans").select("id", count="exact").eq("user_id", str(user_id)).execute()
        
        def _fetch_overdue_loans():
            return self.client.table("loans").select("id", count="exact").eq("user_id", str(user_id)).eq("status", "overdue").execute()
        
        def _fetch_pending_requests():
            return self.client.table("loans").select("id", count="exact").eq("user_id", str(user_id)).eq("status", "pending").execute()
        
        try:
            active_response = await asyncio.to_thread(_fetch_active_loans)
            total_response = await asyncio.to_thread(_fetch_total_loans)
            overdue_response = await asyncio.to_thread(_fetch_overdue_loans)
            pending_response = await asyncio.to_thread(_fetch_pending_requests)
            
            user_data = await self.SelectUserById(user_id)
            
            return {
                'active_loans': active_response.count if active_response.count else 0,
                'total_loans': total_response.count if total_response.count else 0,
                'overdue_loans': overdue_response.count if overdue_response.count else 0,
                'infractions': user_data.get('infractions_count', 0) if user_data else 0,
                'pending_requests': pending_response.count if pending_response.count else 0
            }
        except Exception:
            return {
                'active_loans': 0,
                'total_loans': 0,
                'overdue_loans': 0,
                'infractions': 0,
                'pending_requests': 0
            }
