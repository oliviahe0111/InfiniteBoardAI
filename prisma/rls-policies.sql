-- Enable Row Level Security on tables
ALTER TABLE "Board" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Node" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own boards" ON "Board";
DROP POLICY IF EXISTS "Users can create their own boards" ON "Board";
DROP POLICY IF EXISTS "Users can update their own boards" ON "Board";
DROP POLICY IF EXISTS "Users can delete their own boards" ON "Board";

DROP POLICY IF EXISTS "Users can view nodes from their boards" ON "Node";
DROP POLICY IF EXISTS "Users can create nodes in their boards" ON "Node";
DROP POLICY IF EXISTS "Users can update nodes in their boards" ON "Node";
DROP POLICY IF EXISTS "Users can delete nodes from their boards" ON "Node";

-- Board Policies
CREATE POLICY "Users can view their own boards"
  ON "Board"
  FOR SELECT
  USING (auth.uid() = "ownerId");

CREATE POLICY "Users can create their own boards"
  ON "Board"
  FOR INSERT
  WITH CHECK (auth.uid() = "ownerId");

CREATE POLICY "Users can update their own boards"
  ON "Board"
  FOR UPDATE
  USING (auth.uid() = "ownerId");

CREATE POLICY "Users can delete their own boards"
  ON "Board"
  FOR DELETE
  USING (auth.uid() = "ownerId");

-- Node Policies (based on board ownership)
CREATE POLICY "Users can view nodes from their boards"
  ON "Node"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Board"
      WHERE "Board"."id" = "Node"."boardId"
      AND "Board"."ownerId" = auth.uid()
    )
  );

CREATE POLICY "Users can create nodes in their boards"
  ON "Node"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Board"
      WHERE "Board"."id" = "Node"."boardId"
      AND "Board"."ownerId" = auth.uid()
    )
  );

CREATE POLICY "Users can update nodes in their boards"
  ON "Node"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "Board"
      WHERE "Board"."id" = "Node"."boardId"
      AND "Board"."ownerId" = auth.uid()
    )
  );

CREATE POLICY "Users can delete nodes from their boards"
  ON "Node"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "Board"
      WHERE "Board"."id" = "Node"."boardId"
      AND "Board"."ownerId" = auth.uid()
    )
  );
