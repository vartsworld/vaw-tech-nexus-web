CREATE TABLE scheduled_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    duration TEXT,
    status TEXT DEFAULT 'Scheduled',
    type TEXT,
    link TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    invited_users UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE scheduled_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scheduled meetings"
ON scheduled_meetings FOR SELECT
USING (true);

CREATE POLICY "Users can insert meetings"
ON scheduled_meetings FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their meetings"
ON scheduled_meetings FOR UPDATE
USING (auth.uid() = created_by);
