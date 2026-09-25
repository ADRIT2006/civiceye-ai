from fastapi import Header, HTTPException, status
from typing import Optional, List

def get_current_role(x_user_role: Optional[str] = Header("citizen")) -> str:
    """Extracts and standardizes user role from request header."""
    role = (x_user_role or "citizen").lower().strip()
    if role in ["admin", "authority", "commissioner"]:
        return "admin"
    if role in ["worker", "municipal worker", "crew"]:
        return "worker"
    return "citizen"

def require_role(allowed_roles: List[str]):
    """Enforces role-based authorization on API endpoints."""
    def dependency(x_user_role: Optional[str] = Header("citizen")):
        role = get_current_role(x_user_role)
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Action requires one of [{', '.join(allowed_roles)}] permissions. Current role is '{role}'."
            )
        return role
    return dependency
