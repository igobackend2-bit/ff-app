import { NextResponse } from 'next/server';

// Notifications are stored in a separate table — return empty for now
// (notifications table uses a different schema not yet migrated)
export async function GET() {
  return NextResponse.json({ notifications: [], unreadCount: 0 });
}
