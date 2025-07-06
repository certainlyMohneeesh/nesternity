-- CreateIndex
CREATE INDEX "idx_activities_created_at" ON "activities"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_activities_user_id" ON "activities"("user_id");

-- CreateIndex
CREATE INDEX "idx_activities_user_recent" ON "activities"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_board_lists_board_id" ON "board_lists"("board_id");

-- CreateIndex
CREATE INDEX "idx_board_lists_position" ON "board_lists"("board_id", "position");

-- CreateIndex
CREATE INDEX "idx_boards_project_id" ON "boards"("project_id");

-- CreateIndex
CREATE INDEX "idx_boards_team_id" ON "boards"("team_id");

-- CreateIndex
CREATE INDEX "idx_boards_team_position" ON "boards"("team_id", "position");

-- CreateIndex
CREATE INDEX "idx_clients_created_at_desc" ON "clients"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_clients_created_by" ON "clients"("created_by");

-- CreateIndex
CREATE INDEX "idx_invoice_items_invoice_id" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_invoices_client_id" ON "invoices"("client_id");

-- CreateIndex
CREATE INDEX "idx_invoices_client_status" ON "invoices"("client_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "idx_invoices_due_date" ON "invoices"("due_date");

-- CreateIndex
CREATE INDEX "idx_invoices_issued_by_id" ON "invoices"("issued_by_id");

-- CreateIndex
CREATE INDEX "idx_invoices_issued_date" ON "invoices"("issued_date");

-- CreateIndex
CREATE INDEX "idx_invoices_status" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "idx_invoices_user_status" ON "invoices"("issued_by_id", "status", "issued_date" DESC);

-- CreateIndex
CREATE INDEX "idx_issues_assigned_to" ON "issues"("assigned_to");

-- CreateIndex
CREATE INDEX "idx_issues_assignee_status" ON "issues"("assigned_to", "status", "priority");

-- CreateIndex
CREATE INDEX "idx_issues_board_id" ON "issues"("board_id");

-- CreateIndex
CREATE INDEX "idx_issues_created_by" ON "issues"("created_by");

-- CreateIndex
CREATE INDEX "idx_issues_priority" ON "issues"("priority");

-- CreateIndex
CREATE INDEX "idx_issues_project_id" ON "issues"("project_id");

-- CreateIndex
CREATE INDEX "idx_issues_status" ON "issues"("status");

-- CreateIndex
CREATE INDEX "idx_projects_client_id" ON "projects"("client_id");

-- CreateIndex
CREATE INDEX "idx_projects_status" ON "projects"("status");

-- CreateIndex
CREATE INDEX "idx_projects_team_id" ON "projects"("team_id");

-- CreateIndex
CREATE INDEX "idx_projects_team_status" ON "projects"("team_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_tasks_assigned_to" ON "tasks"("assigned_to");

-- CreateIndex
CREATE INDEX "idx_tasks_assignee_status" ON "tasks"("assigned_to", "status", "due_date");

-- CreateIndex
CREATE INDEX "idx_tasks_board_id" ON "tasks"("board_id");

-- CreateIndex
CREATE INDEX "idx_tasks_board_list_position" ON "tasks"("board_id", "list_id", "position");

-- CreateIndex
CREATE INDEX "idx_tasks_list_id" ON "tasks"("list_id");

-- CreateIndex
CREATE INDEX "idx_tasks_priority" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "idx_tasks_status" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "idx_team_invites_email" ON "team_invites"("email");

-- CreateIndex
CREATE INDEX "idx_team_invites_team_id" ON "team_invites"("team_id");

-- CreateIndex
CREATE INDEX "idx_team_invites_token" ON "team_invites"("token");

-- CreateIndex
CREATE INDEX "idx_team_members_role" ON "team_members"("team_id", "role");

-- CreateIndex
CREATE INDEX "idx_team_members_team_id" ON "team_members"("team_id");

-- CreateIndex
CREATE INDEX "idx_team_members_user_id" ON "team_members"("user_id");

-- CreateIndex
CREATE INDEX "idx_teams_created_at_desc" ON "teams"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_teams_created_by" ON "teams"("created_by");

-- CreateIndex
CREATE INDEX "idx_users_created_at_desc" ON "users"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");
