-- Enable realtime for user_presence_status and staff_notifications tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence_status;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_notifications;