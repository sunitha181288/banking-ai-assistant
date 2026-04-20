# agent/tools.py
# ──────────────────────────────────────────────
# WHAT THIS FILE DOES:
# Defines the "tools" that the AI agent can call.
#
# WHAT IS A TOOL (in AI)?
# A tool is a function the AI is ALLOWED to call.
# We describe each tool to Claude:
#   - What it's called
#   - What it does
#   - What inputs it needs
# Claude then DECIDES when to use each tool.
#
# In a real bank: these tools would call real APIs.
# Here: we return realistic fake data for demo purposes.
# ──────────────────────────────────────────────

import random
import string
from datetime import datetime, timedelta
from typing import Any, Dict


# ── TOOL DEFINITIONS ──────────────────────────
# These are sent to Claude so it knows what tools exist.
# Claude reads these descriptions to decide which tool to call.

TOOL_DEFINITIONS = [
    {
        "name": "account_lookup",
        "description": "Look up a customer's account details including balance, status, card status, and contact info by account ID.",
        "input_schema": {
            "type": "object",
            "properties": {
                "account_id": {
                    "type": "string",
                    "description": "The account ID, e.g. ACC-4521"
                }
            },
            "required": ["account_id"]
        }
    },
    {
        "name": "transaction_search",
        "description": "Search recent transactions for an account. Can filter by number of days back and minimum amount.",
        "input_schema": {
            "type": "object",
            "properties": {
                "account_id": {"type": "string"},
                "days": {
                    "type": "number",
                    "description": "How many days back to search (default 30)"
                },
                "min_amount": {
                    "type": "number",
                    "description": "Minimum transaction amount to include"
                }
            },
            "required": ["account_id"]
        }
    },
    {
        "name": "policy_lookup",
        "description": "Retrieve bank policies, fees, and product terms by category.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Policy category, e.g. international_transfers, card_fees, overdraft, loans"
                }
            },
            "required": ["category"]
        }
    },
    {
        "name": "flag_account",
        "description": "Flag an account for suspicious activity or freeze it for security review.",
        "input_schema": {
            "type": "object",
            "properties": {
                "account_id": {"type": "string"},
                "reason": {"type": "string", "description": "Reason for flagging"},
                "action": {
                    "type": "string",
                    "enum": ["flag", "freeze"],
                    "description": "flag = mark for review, freeze = block all transactions"
                }
            },
            "required": ["account_id", "reason", "action"]
        }
    },
    {
        "name": "create_ticket",
        "description": "Create a support ticket for a customer complaint or service request.",
        "input_schema": {
            "type": "object",
            "properties": {
                "account_id": {"type": "string"},
                "category": {"type": "string", "description": "e.g. fraud, complaint, enquiry"},
                "description": {"type": "string"},
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "urgent"]
                }
            },
            "required": ["account_id", "category", "description", "priority"]
        }
    },
    {
        "name": "send_notification",
        "description": "Send an email or SMS notification to the customer.",
        "input_schema": {
            "type": "object",
            "properties": {
                "account_id": {"type": "string"},
                "channel": {"type": "string", "enum": ["email", "sms"]},
                "subject": {"type": "string"},
                "message": {"type": "string"}
            },
            "required": ["account_id", "channel", "subject", "message"]
        }
    }
]


# ── TOOL EXECUTION ─────────────────────────────
# These functions simulate what the tools actually do.
# In production, these would call real banking APIs.

def execute_tool(tool_name: str, tool_input: Dict) -> Dict[str, Any]:
    """
    Router: calls the right function based on tool name.
    Returns a dict result that gets sent back to Claude.
    """
    handlers = {
        "account_lookup":    _account_lookup,
        "transaction_search": _transaction_search,
        "policy_lookup":     _policy_lookup,
        "flag_account":      _flag_account,
        "create_ticket":     _create_ticket,
        "send_notification": _send_notification,
    }

    handler = handlers.get(tool_name)
    if not handler:
        return {"error": f"Unknown tool: {tool_name}"}

    return handler(**tool_input)


def _account_lookup(account_id: str) -> Dict:
    """Simulates fetching customer data from a core banking system."""
    return {
        "account_id": account_id,
        "holder_name": "Sarah Chen",
        "email": "s.chen@email.com",
        "phone": "+852 9XXX XXXX",
        "balance": "HKD 45,230.00",
        "account_status": "active",
        "card_status": "active",
        "card_last4": "4521",
        "last_login": "2024-01-15 09:23 HKT",
        "home_country": "Hong Kong",
        "joined": "2019-03-12"
    }


def _transaction_search(account_id: str, days: int = 30, min_amount: float = 0) -> Dict:
    """Simulates querying a transaction database."""
    all_transactions = [
        {"date": "2024-01-15", "merchant": "Singapore Airlines",    "amount": 4800, "currency": "SGD", "location": "Singapore", "status": "completed"},
        {"date": "2024-01-15", "merchant": "Mandarin Oriental SG",  "amount": 1200, "currency": "SGD", "location": "Singapore", "status": "completed"},
        {"date": "2024-01-14", "merchant": "Changi Airport T3",     "amount": 320,  "currency": "SGD", "location": "Singapore", "status": "completed"},
        {"date": "2024-01-13", "merchant": "ParkNShop Hong Kong",   "amount": 180,  "currency": "HKD", "location": "Hong Kong",  "status": "completed"},
        {"date": "2024-01-12", "merchant": "MTR Hong Kong",         "amount": 45,   "currency": "HKD", "location": "Hong Kong",  "status": "completed"},
        {"date": "2024-01-10", "merchant": "IKEA Hong Kong",        "amount": 2300, "currency": "HKD", "location": "Hong Kong",  "status": "completed"},
    ]
    filtered = [t for t in all_transactions if t["amount"] >= min_amount]
    return {
        "account_id": account_id,
        "period_days": days,
        "transaction_count": len(filtered),
        "transactions": filtered
    }


def _policy_lookup(category: str) -> Dict:
    """Simulates querying a policy/product database."""
    policies = {
        "international_transfers": "International wire transfer fee: HKD 200 flat + 0.25% (min HKD 50, max HKD 500). Processing: 1-3 business days. SWIFT supported.",
        "card_fees": "Foreign transaction fee: 1.5% of transaction value. ATM abroad: HKD 50 per withdrawal. Emergency card replacement: HKD 300. Express delivery: HKD 500.",
        "overdraft": "Overdraft facility: up to HKD 50,000 for eligible accounts. Interest: prime + 5% p.a. Activation fee: HKD 200.",
        "loans": "Personal loan rates from 5.5% p.a. (flat). Maximum tenure: 60 months. Minimum loan: HKD 20,000. Income requirement: HKD 10,000/month.",
        "fraud": "Fraudulent transaction disputes must be raised within 60 days. Card is frozen immediately upon fraud report. Investigation: 5-10 business days. Provisional credit may be issued within 5 days."
    }
    # Find best matching policy
    for key, policy in policies.items():
        if key in category.lower() or category.lower() in key:
            return {"category": category, "policy": policy, "last_updated": "2024-01-01"}
    return {"category": category, "policy": "Please contact the branch for specific policy information on this topic.", "last_updated": "2024-01-01"}


def _flag_account(account_id: str, reason: str, action: str) -> Dict:
    """Simulates flagging or freezing an account in the security system."""
    case_id = "CASE-" + "".join(random.choices(string.digits, k=6))
    return {
        "success": True,
        "account_id": account_id,
        "action_taken": action,
        "case_id": case_id,
        "reason": reason,
        "timestamp": datetime.now().isoformat(),
        "message": f"Account {account_id} has been {'frozen — all transactions blocked' if action == 'freeze' else 'flagged for security review'}. Fraud team notified. Case: {case_id}"
    }


def _create_ticket(account_id: str, category: str, description: str, priority: str) -> Dict:
    """Simulates creating a ticket in a CRM/support system."""
    ticket_id = "TKT-" + "".join(random.choices(string.digits, k=6))
    sla = {"urgent": "2 hours", "high": "4 hours", "medium": "24 hours", "low": "72 hours"}
    return {
        "success": True,
        "ticket_id": ticket_id,
        "account_id": account_id,
        "category": category,
        "priority": priority,
        "estimated_response": sla.get(priority, "24 hours"),
        "assigned_team": "Fraud & Security" if "fraud" in category.lower() else "Customer Support",
        "created_at": datetime.now().isoformat()
    }


def _send_notification(account_id: str, channel: str, subject: str, message: str) -> Dict:
    """Simulates sending email/SMS through a notification service."""
    return {
        "success": True,
        "account_id": account_id,
        "channel": channel,
        "recipient": "s.chen@email.com" if channel == "email" else "+852 9XXX XXXX",
        "subject": subject,
        "status": "delivered",
        "timestamp": datetime.now().isoformat()
    }
