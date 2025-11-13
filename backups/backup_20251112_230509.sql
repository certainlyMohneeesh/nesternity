--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.5 (Ubuntu 17.5-1.pgdg24.04+1)

-- Started on 2025-11-12 23:05:09 IST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP EVENT TRIGGER IF EXISTS pgrst_drop_watch;
DROP EVENT TRIGGER IF EXISTS pgrst_ddl_watch;
DROP EVENT TRIGGER IF EXISTS issue_pg_net_access;
DROP EVENT TRIGGER IF EXISTS issue_pg_graphql_access;
DROP EVENT TRIGGER IF EXISTS issue_pg_cron_access;
DROP EVENT TRIGGER IF EXISTS issue_graphql_placeholder;
DROP PUBLICATION IF EXISTS supabase_realtime;
DROP POLICY IF EXISTS "Public Read Access for Proposals" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for Invoices" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for Proposals" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for Invoices" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update for Proposals" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update for Invoices" ON storage.objects;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_upload_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_bucket_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads DROP CONSTRAINT IF EXISTS s3_multipart_uploads_bucket_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.prefixes DROP CONSTRAINT IF EXISTS "prefixes_bucketId_fkey";
ALTER TABLE IF EXISTS ONLY storage.objects DROP CONSTRAINT IF EXISTS "objects_bucketId_fkey";
ALTER TABLE IF EXISTS ONLY public.update_drafts DROP CONSTRAINT IF EXISTS update_drafts_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.update_drafts DROP CONSTRAINT IF EXISTS update_drafts_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS team_members_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.team_invites DROP CONSTRAINT IF EXISTS team_invites_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.team_invites DROP CONSTRAINT IF EXISTS team_invites_invited_by_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_list_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_board_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
ALTER TABLE IF EXISTS ONLY public.task_comments DROP CONSTRAINT IF EXISTS task_comments_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_comments DROP CONSTRAINT IF EXISTS task_comments_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_attachments DROP CONSTRAINT IF EXISTS task_attachments_uploaded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.task_attachments DROP CONSTRAINT IF EXISTS task_attachments_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_activities DROP CONSTRAINT IF EXISTS task_activities_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_activities DROP CONSTRAINT IF EXISTS task_activities_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.signatures DROP CONSTRAINT IF EXISTS signatures_proposal_id_fkey;
ALTER TABLE IF EXISTS ONLY public.scope_radar DROP CONSTRAINT IF EXISTS scope_radar_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.proposals DROP CONSTRAINT IF EXISTS proposals_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.proposals DROP CONSTRAINT IF EXISTS proposals_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_settings DROP CONSTRAINT IF EXISTS payment_settings_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisations DROP CONSTRAINT IF EXISTS organisations_owner_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_activity_id_fkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_board_id_fkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_assigned_to_fkey;
ALTER TABLE IF EXISTS ONLY public.issue_comments DROP CONSTRAINT IF EXISTS issue_comments_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.issue_comments DROP CONSTRAINT IF EXISTS issue_comments_issue_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_issued_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.estimations DROP CONSTRAINT IF EXISTS estimations_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.estimations DROP CONSTRAINT IF EXISTS estimations_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS clients_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.boards DROP CONSTRAINT IF EXISTS boards_team_id_fkey;
ALTER TABLE IF EXISTS ONLY public.boards DROP CONSTRAINT IF EXISTS boards_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.board_lists DROP CONSTRAINT IF EXISTS board_lists_board_id_fkey;
ALTER TABLE IF EXISTS ONLY public.board_activities DROP CONSTRAINT IF EXISTS board_activities_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.board_activities DROP CONSTRAINT IF EXISTS board_activities_board_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activities DROP CONSTRAINT IF EXISTS activities_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activities DROP CONSTRAINT IF EXISTS activities_team_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.sso_domains DROP CONSTRAINT IF EXISTS sso_domains_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.sessions DROP CONSTRAINT IF EXISTS sessions_oauth_client_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_flow_state_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_session_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.one_time_tokens DROP CONSTRAINT IF EXISTS one_time_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_client_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_client_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_challenges DROP CONSTRAINT IF EXISTS mfa_challenges_auth_factor_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS mfa_amr_claims_session_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_user_id_fkey;
DROP TRIGGER IF EXISTS update_objects_updated_at ON storage.objects;
DROP TRIGGER IF EXISTS prefixes_delete_hierarchy ON storage.prefixes;
DROP TRIGGER IF EXISTS prefixes_create_hierarchy ON storage.prefixes;
DROP TRIGGER IF EXISTS objects_update_create_prefix ON storage.objects;
DROP TRIGGER IF EXISTS objects_insert_create_prefix ON storage.objects;
DROP TRIGGER IF EXISTS objects_delete_delete_prefix ON storage.objects;
DROP TRIGGER IF EXISTS enforce_bucket_name_length_trigger ON storage.buckets;
DROP TRIGGER IF EXISTS tr_check_filters ON realtime.subscription;
DROP INDEX IF EXISTS storage.objects_bucket_id_level_idx;
DROP INDEX IF EXISTS storage.name_prefix_search;
DROP INDEX IF EXISTS storage.idx_prefixes_lower_name;
DROP INDEX IF EXISTS storage.idx_objects_lower_name;
DROP INDEX IF EXISTS storage.idx_objects_bucket_id_name;
DROP INDEX IF EXISTS storage.idx_name_bucket_level_unique;
DROP INDEX IF EXISTS storage.idx_multipart_uploads_list;
DROP INDEX IF EXISTS storage.bucketid_objname;
DROP INDEX IF EXISTS storage.bname;
DROP INDEX IF EXISTS realtime.subscription_subscription_id_entity_filters_key;
DROP INDEX IF EXISTS realtime.messages_inserted_at_topic_index;
DROP INDEX IF EXISTS realtime.ix_realtime_subscription_entity;
DROP INDEX IF EXISTS public.users_stripe_customer_id_key;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.team_members_team_id_user_id_key;
DROP INDEX IF EXISTS public.team_invites_token_key;
DROP INDEX IF EXISTS public.team_invites_team_id_email_key;
DROP INDEX IF EXISTS public.subscriptions_user_id_key;
DROP INDEX IF EXISTS public.proposals_access_token_key;
DROP INDEX IF EXISTS public.payment_settings_user_id_key;
DROP INDEX IF EXISTS public.payment_settings_razorpay_account_id_key;
DROP INDEX IF EXISTS public.notifications_user_id_read_at_idx;
DROP INDEX IF EXISTS public.notifications_user_id_created_at_idx;
DROP INDEX IF EXISTS public.notifications_user_id_activity_id_key;
DROP INDEX IF EXISTS public."invoices_invoiceNumber_key";
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_created_at_desc;
DROP INDEX IF EXISTS public.idx_updates_week_start;
DROP INDEX IF EXISTS public.idx_updates_status;
DROP INDEX IF EXISTS public.idx_updates_project_id;
DROP INDEX IF EXISTS public.idx_updates_client_id;
DROP INDEX IF EXISTS public.idx_teams_created_by;
DROP INDEX IF EXISTS public.idx_teams_created_at_desc;
DROP INDEX IF EXISTS public.idx_team_members_user_id;
DROP INDEX IF EXISTS public.idx_team_members_team_id;
DROP INDEX IF EXISTS public.idx_team_members_role;
DROP INDEX IF EXISTS public.idx_team_invites_token;
DROP INDEX IF EXISTS public.idx_team_invites_team_id;
DROP INDEX IF EXISTS public.idx_team_invites_email;
DROP INDEX IF EXISTS public.idx_tasks_status;
DROP INDEX IF EXISTS public.idx_tasks_priority;
DROP INDEX IF EXISTS public.idx_tasks_list_id;
DROP INDEX IF EXISTS public.idx_tasks_board_list_position;
DROP INDEX IF EXISTS public.idx_tasks_board_id;
DROP INDEX IF EXISTS public.idx_tasks_assignee_status;
DROP INDEX IF EXISTS public.idx_tasks_assigned_to;
DROP INDEX IF EXISTS public.idx_signatures_signed_at;
DROP INDEX IF EXISTS public.idx_signatures_proposal_id;
DROP INDEX IF EXISTS public.idx_scope_radar_risk;
DROP INDEX IF EXISTS public.idx_scope_radar_project_id;
DROP INDEX IF EXISTS public.idx_scope_radar_flagged_at;
DROP INDEX IF EXISTS public.idx_scope_radar_email_sent;
DROP INDEX IF EXISTS public.idx_scope_radar_budget_overrun;
DROP INDEX IF EXISTS public.idx_proposals_status;
DROP INDEX IF EXISTS public.idx_proposals_project_id;
DROP INDEX IF EXISTS public.idx_proposals_created_at;
DROP INDEX IF EXISTS public.idx_proposals_client_id;
DROP INDEX IF EXISTS public.idx_projects_team_status;
DROP INDEX IF EXISTS public.idx_projects_team_id;
DROP INDEX IF EXISTS public.idx_projects_status;
DROP INDEX IF EXISTS public.idx_projects_organisation_id;
DROP INDEX IF EXISTS public.idx_projects_org_status;
DROP INDEX IF EXISTS public.idx_projects_client_id;
DROP INDEX IF EXISTS public.idx_payment_settings_user_id;
DROP INDEX IF EXISTS public.idx_payment_settings_status;
DROP INDEX IF EXISTS public.idx_payment_settings_razorpay_account;
DROP INDEX IF EXISTS public.idx_organisations_type;
DROP INDEX IF EXISTS public.idx_organisations_status;
DROP INDEX IF EXISTS public.idx_organisations_owner_type;
DROP INDEX IF EXISTS public.idx_organisations_owner_id;
DROP INDEX IF EXISTS public.idx_organisations_created_at_desc;
DROP INDEX IF EXISTS public.idx_issues_status;
DROP INDEX IF EXISTS public.idx_issues_project_id;
DROP INDEX IF EXISTS public.idx_issues_priority;
DROP INDEX IF EXISTS public.idx_issues_created_by;
DROP INDEX IF EXISTS public.idx_issues_board_id;
DROP INDEX IF EXISTS public.idx_issues_assignee_status;
DROP INDEX IF EXISTS public.idx_issues_assigned_to;
DROP INDEX IF EXISTS public.idx_invoices_user_status;
DROP INDEX IF EXISTS public.idx_invoices_status;
DROP INDEX IF EXISTS public.idx_invoices_recurring_next;
DROP INDEX IF EXISTS public.idx_invoices_razorpay_link_id;
DROP INDEX IF EXISTS public.idx_invoices_parent_id;
DROP INDEX IF EXISTS public.idx_invoices_issued_date;
DROP INDEX IF EXISTS public.idx_invoices_issued_by_id;
DROP INDEX IF EXISTS public.idx_invoices_due_date;
DROP INDEX IF EXISTS public.idx_invoices_client_status;
DROP INDEX IF EXISTS public.idx_invoices_client_id;
DROP INDEX IF EXISTS public.idx_invoice_items_invoice_id;
DROP INDEX IF EXISTS public.idx_estimations_project_id;
DROP INDEX IF EXISTS public.idx_estimations_created_at;
DROP INDEX IF EXISTS public.idx_estimations_client_id;
DROP INDEX IF EXISTS public.idx_clients_created_by;
DROP INDEX IF EXISTS public.idx_clients_created_at_desc;
DROP INDEX IF EXISTS public.idx_budget_estimations_user_id;
DROP INDEX IF EXISTS public.idx_budget_estimations_created_at;
DROP INDEX IF EXISTS public.idx_budget_estimations_accuracy;
DROP INDEX IF EXISTS public.idx_boards_team_position;
DROP INDEX IF EXISTS public.idx_boards_team_id;
DROP INDEX IF EXISTS public.idx_boards_project_id;
DROP INDEX IF EXISTS public.idx_board_lists_position;
DROP INDEX IF EXISTS public.idx_board_lists_board_id;
DROP INDEX IF EXISTS public.idx_activities_user_recent;
DROP INDEX IF EXISTS public.idx_activities_user_id;
DROP INDEX IF EXISTS public.idx_activities_created_at;
DROP INDEX IF EXISTS auth.users_is_anonymous_idx;
DROP INDEX IF EXISTS auth.users_instance_id_idx;
DROP INDEX IF EXISTS auth.users_instance_id_email_idx;
DROP INDEX IF EXISTS auth.users_email_partial_key;
DROP INDEX IF EXISTS auth.user_id_created_at_idx;
DROP INDEX IF EXISTS auth.unique_phone_factor_per_user;
DROP INDEX IF EXISTS auth.sso_providers_resource_id_pattern_idx;
DROP INDEX IF EXISTS auth.sso_providers_resource_id_idx;
DROP INDEX IF EXISTS auth.sso_domains_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.sso_domains_domain_idx;
DROP INDEX IF EXISTS auth.sessions_user_id_idx;
DROP INDEX IF EXISTS auth.sessions_oauth_client_id_idx;
DROP INDEX IF EXISTS auth.sessions_not_after_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_for_email_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_created_at_idx;
DROP INDEX IF EXISTS auth.saml_providers_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_updated_at_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_session_id_revoked_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_parent_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_instance_id_user_id_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_instance_id_idx;
DROP INDEX IF EXISTS auth.recovery_token_idx;
DROP INDEX IF EXISTS auth.reauthentication_token_idx;
DROP INDEX IF EXISTS auth.one_time_tokens_user_id_token_type_key;
DROP INDEX IF EXISTS auth.one_time_tokens_token_hash_hash_idx;
DROP INDEX IF EXISTS auth.one_time_tokens_relates_to_hash_idx;
DROP INDEX IF EXISTS auth.oauth_consents_user_order_idx;
DROP INDEX IF EXISTS auth.oauth_consents_active_user_client_idx;
DROP INDEX IF EXISTS auth.oauth_consents_active_client_idx;
DROP INDEX IF EXISTS auth.oauth_clients_deleted_at_idx;
DROP INDEX IF EXISTS auth.oauth_auth_pending_exp_idx;
DROP INDEX IF EXISTS auth.mfa_factors_user_id_idx;
DROP INDEX IF EXISTS auth.mfa_factors_user_friendly_name_unique;
DROP INDEX IF EXISTS auth.mfa_challenge_created_at_idx;
DROP INDEX IF EXISTS auth.idx_user_id_auth_method;
DROP INDEX IF EXISTS auth.idx_auth_code;
DROP INDEX IF EXISTS auth.identities_user_id_idx;
DROP INDEX IF EXISTS auth.identities_email_idx;
DROP INDEX IF EXISTS auth.flow_state_created_at_idx;
DROP INDEX IF EXISTS auth.factor_id_created_at_idx;
DROP INDEX IF EXISTS auth.email_change_token_new_idx;
DROP INDEX IF EXISTS auth.email_change_token_current_idx;
DROP INDEX IF EXISTS auth.confirmation_token_idx;
DROP INDEX IF EXISTS auth.audit_logs_instance_id_idx;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads DROP CONSTRAINT IF EXISTS s3_multipart_uploads_pkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_pkey;
ALTER TABLE IF EXISTS ONLY storage.prefixes DROP CONSTRAINT IF EXISTS prefixes_pkey;
ALTER TABLE IF EXISTS ONLY storage.objects DROP CONSTRAINT IF EXISTS objects_pkey;
ALTER TABLE IF EXISTS ONLY storage.migrations DROP CONSTRAINT IF EXISTS migrations_pkey;
ALTER TABLE IF EXISTS ONLY storage.migrations DROP CONSTRAINT IF EXISTS migrations_name_key;
ALTER TABLE IF EXISTS ONLY storage.buckets DROP CONSTRAINT IF EXISTS buckets_pkey;
ALTER TABLE IF EXISTS ONLY storage.buckets_analytics DROP CONSTRAINT IF EXISTS buckets_analytics_pkey;
ALTER TABLE IF EXISTS ONLY realtime.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY realtime.subscription DROP CONSTRAINT IF EXISTS pk_subscription;
ALTER TABLE IF EXISTS ONLY realtime.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.update_drafts DROP CONSTRAINT IF EXISTS update_drafts_pkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_pkey;
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS team_members_pkey;
ALTER TABLE IF EXISTS ONLY public.team_invites DROP CONSTRAINT IF EXISTS team_invites_pkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.task_comments DROP CONSTRAINT IF EXISTS task_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.task_attachments DROP CONSTRAINT IF EXISTS task_attachments_pkey;
ALTER TABLE IF EXISTS ONLY public.task_activities DROP CONSTRAINT IF EXISTS task_activities_pkey;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.signatures DROP CONSTRAINT IF EXISTS signatures_pkey;
ALTER TABLE IF EXISTS ONLY public.scope_radar DROP CONSTRAINT IF EXISTS scope_radar_pkey;
ALTER TABLE IF EXISTS ONLY public.proposals DROP CONSTRAINT IF EXISTS proposals_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_settings DROP CONSTRAINT IF EXISTS payment_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.organisations DROP CONSTRAINT IF EXISTS organisations_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_pkey;
ALTER TABLE IF EXISTS ONLY public.issue_comments DROP CONSTRAINT IF EXISTS issue_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_pkey;
ALTER TABLE IF EXISTS ONLY public.estimations DROP CONSTRAINT IF EXISTS estimations_pkey;
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS clients_pkey;
ALTER TABLE IF EXISTS ONLY public.budget_estimations DROP CONSTRAINT IF EXISTS budget_estimations_pkey;
ALTER TABLE IF EXISTS ONLY public.boards DROP CONSTRAINT IF EXISTS boards_pkey;
ALTER TABLE IF EXISTS ONLY public.board_lists DROP CONSTRAINT IF EXISTS board_lists_pkey;
ALTER TABLE IF EXISTS ONLY public.board_activities DROP CONSTRAINT IF EXISTS board_activities_pkey;
ALTER TABLE IF EXISTS ONLY public.activities DROP CONSTRAINT IF EXISTS activities_pkey;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_phone_key;
ALTER TABLE IF EXISTS ONLY auth.sso_providers DROP CONSTRAINT IF EXISTS sso_providers_pkey;
ALTER TABLE IF EXISTS ONLY auth.sso_domains DROP CONSTRAINT IF EXISTS sso_domains_pkey;
ALTER TABLE IF EXISTS ONLY auth.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY auth.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_entity_id_key;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY auth.one_time_tokens DROP CONSTRAINT IF EXISTS one_time_tokens_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_user_client_unique;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_clients DROP CONSTRAINT IF EXISTS oauth_clients_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_authorization_id_key;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_authorization_code_key;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_last_challenged_at_key;
ALTER TABLE IF EXISTS ONLY auth.mfa_challenges DROP CONSTRAINT IF EXISTS mfa_challenges_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS mfa_amr_claims_session_id_authentication_method_pkey;
ALTER TABLE IF EXISTS ONLY auth.instances DROP CONSTRAINT IF EXISTS instances_pkey;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_provider_id_provider_unique;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_pkey;
ALTER TABLE IF EXISTS ONLY auth.flow_state DROP CONSTRAINT IF EXISTS flow_state_pkey;
ALTER TABLE IF EXISTS ONLY auth.audit_log_entries DROP CONSTRAINT IF EXISTS audit_log_entries_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS amr_id_pk;
ALTER TABLE IF EXISTS auth.refresh_tokens ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS storage.s3_multipart_uploads_parts;
DROP TABLE IF EXISTS storage.s3_multipart_uploads;
DROP TABLE IF EXISTS storage.prefixes;
DROP TABLE IF EXISTS storage.objects;
DROP TABLE IF EXISTS storage.migrations;
DROP TABLE IF EXISTS storage.buckets_analytics;
DROP TABLE IF EXISTS storage.buckets;
DROP TABLE IF EXISTS realtime.subscription;
DROP TABLE IF EXISTS realtime.schema_migrations;
DROP TABLE IF EXISTS realtime.messages;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.update_drafts;
DROP TABLE IF EXISTS public.teams;
DROP TABLE IF EXISTS public.team_members;
DROP TABLE IF EXISTS public.team_invites;
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.task_comments;
DROP TABLE IF EXISTS public.task_attachments;
DROP TABLE IF EXISTS public.task_activities;
DROP TABLE IF EXISTS public.subscriptions;
DROP TABLE IF EXISTS public.signatures;
DROP TABLE IF EXISTS public.scope_radar;
DROP TABLE IF EXISTS public.proposals;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.payment_settings;
DROP TABLE IF EXISTS public.organisations;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.issues;
DROP TABLE IF EXISTS public.issue_comments;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.invoice_items;
DROP TABLE IF EXISTS public.estimations;
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS public.budget_estimations;
DROP TABLE IF EXISTS public.boards;
DROP TABLE IF EXISTS public.board_lists;
DROP TABLE IF EXISTS public.board_activities;
DROP TABLE IF EXISTS public.activities;
DROP TABLE IF EXISTS auth.users;
DROP TABLE IF EXISTS auth.sso_providers;
DROP TABLE IF EXISTS auth.sso_domains;
DROP TABLE IF EXISTS auth.sessions;
DROP TABLE IF EXISTS auth.schema_migrations;
DROP TABLE IF EXISTS auth.saml_relay_states;
DROP TABLE IF EXISTS auth.saml_providers;
DROP SEQUENCE IF EXISTS auth.refresh_tokens_id_seq;
DROP TABLE IF EXISTS auth.refresh_tokens;
DROP TABLE IF EXISTS auth.one_time_tokens;
DROP TABLE IF EXISTS auth.oauth_consents;
DROP TABLE IF EXISTS auth.oauth_clients;
DROP TABLE IF EXISTS auth.oauth_authorizations;
DROP TABLE IF EXISTS auth.mfa_factors;
DROP TABLE IF EXISTS auth.mfa_challenges;
DROP TABLE IF EXISTS auth.mfa_amr_claims;
DROP TABLE IF EXISTS auth.instances;
DROP TABLE IF EXISTS auth.identities;
DROP TABLE IF EXISTS auth.flow_state;
DROP TABLE IF EXISTS auth.audit_log_entries;
DROP FUNCTION IF EXISTS storage.update_updated_at_column();
DROP FUNCTION IF EXISTS storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text);
DROP FUNCTION IF EXISTS storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text);
DROP FUNCTION IF EXISTS storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text);
DROP FUNCTION IF EXISTS storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text);
DROP FUNCTION IF EXISTS storage.prefixes_insert_trigger();
DROP FUNCTION IF EXISTS storage.prefixes_delete_cleanup();
DROP FUNCTION IF EXISTS storage.operation();
DROP FUNCTION IF EXISTS storage.objects_update_prefix_trigger();
DROP FUNCTION IF EXISTS storage.objects_update_level_trigger();
DROP FUNCTION IF EXISTS storage.objects_update_cleanup();
DROP FUNCTION IF EXISTS storage.objects_insert_prefix_trigger();
DROP FUNCTION IF EXISTS storage.objects_delete_cleanup();
DROP FUNCTION IF EXISTS storage.lock_top_prefixes(bucket_ids text[], names text[]);
DROP FUNCTION IF EXISTS storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text);
DROP FUNCTION IF EXISTS storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text);
DROP FUNCTION IF EXISTS storage.get_size_by_bucket();
DROP FUNCTION IF EXISTS storage.get_prefixes(name text);
DROP FUNCTION IF EXISTS storage.get_prefix(name text);
DROP FUNCTION IF EXISTS storage.get_level(name text);
DROP FUNCTION IF EXISTS storage.foldername(name text);
DROP FUNCTION IF EXISTS storage.filename(name text);
DROP FUNCTION IF EXISTS storage.extension(name text);
DROP FUNCTION IF EXISTS storage.enforce_bucket_name_length();
DROP FUNCTION IF EXISTS storage.delete_prefix_hierarchy_trigger();
DROP FUNCTION IF EXISTS storage.delete_prefix(_bucket_id text, _name text);
DROP FUNCTION IF EXISTS storage.delete_leaf_prefixes(bucket_ids text[], names text[]);
DROP FUNCTION IF EXISTS storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb);
DROP FUNCTION IF EXISTS storage.add_prefixes(_bucket_id text, _name text);
DROP FUNCTION IF EXISTS realtime.topic();
DROP FUNCTION IF EXISTS realtime.to_regrole(role_name text);
DROP FUNCTION IF EXISTS realtime.subscription_check_filters();
DROP FUNCTION IF EXISTS realtime.send(payload jsonb, event text, topic text, private boolean);
DROP FUNCTION IF EXISTS realtime.quote_wal2json(entity regclass);
DROP FUNCTION IF EXISTS realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer);
DROP FUNCTION IF EXISTS realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]);
DROP FUNCTION IF EXISTS realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text);
DROP FUNCTION IF EXISTS realtime."cast"(val text, type_ regtype);
DROP FUNCTION IF EXISTS realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]);
DROP FUNCTION IF EXISTS realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text);
DROP FUNCTION IF EXISTS realtime.apply_rls(wal jsonb, max_record_bytes integer);
DROP FUNCTION IF EXISTS pgbouncer.get_auth(p_usename text);
DROP FUNCTION IF EXISTS extensions.set_graphql_placeholder();
DROP FUNCTION IF EXISTS extensions.pgrst_drop_watch();
DROP FUNCTION IF EXISTS extensions.pgrst_ddl_watch();
DROP FUNCTION IF EXISTS extensions.grant_pg_net_access();
DROP FUNCTION IF EXISTS extensions.grant_pg_graphql_access();
DROP FUNCTION IF EXISTS extensions.grant_pg_cron_access();
DROP FUNCTION IF EXISTS auth.uid();
DROP FUNCTION IF EXISTS auth.role();
DROP FUNCTION IF EXISTS auth.jwt();
DROP FUNCTION IF EXISTS auth.email();
DROP TYPE IF EXISTS storage.buckettype;
DROP TYPE IF EXISTS realtime.wal_rls;
DROP TYPE IF EXISTS realtime.wal_column;
DROP TYPE IF EXISTS realtime.user_defined_filter;
DROP TYPE IF EXISTS realtime.equality_op;
DROP TYPE IF EXISTS realtime.action;
DROP TYPE IF EXISTS public."UpdateStatus";
DROP TYPE IF EXISTS public."TaskStatus";
DROP TYPE IF EXISTS public."TaskPriority";
DROP TYPE IF EXISTS public."SettlementSchedule";
DROP TYPE IF EXISTS public."ProposalStatus";
DROP TYPE IF EXISTS public."ProjectStatus";
DROP TYPE IF EXISTS public."PaymentMethod";
DROP TYPE IF EXISTS public."OrganisationType";
DROP TYPE IF EXISTS public."OrganisationStatus";
DROP TYPE IF EXISTS public."IssueStatus";
DROP TYPE IF EXISTS public."IssuePriority";
DROP TYPE IF EXISTS public."InvoiceStatus";
DROP TYPE IF EXISTS public."InvoiceRecurrence";
DROP TYPE IF EXISTS public."ClientStatus";
DROP TYPE IF EXISTS public."BoardType";
DROP TYPE IF EXISTS public."AccountType";
DROP TYPE IF EXISTS public."AccountStatus";
DROP TYPE IF EXISTS auth.one_time_token_type;
DROP TYPE IF EXISTS auth.oauth_response_type;
DROP TYPE IF EXISTS auth.oauth_registration_type;
DROP TYPE IF EXISTS auth.oauth_client_type;
DROP TYPE IF EXISTS auth.oauth_authorization_status;
DROP TYPE IF EXISTS auth.factor_type;
DROP TYPE IF EXISTS auth.factor_status;
DROP TYPE IF EXISTS auth.code_challenge_method;
DROP TYPE IF EXISTS auth.aal_level;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS supabase_vault;
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS pg_stat_statements;
DROP EXTENSION IF EXISTS pg_graphql;
DROP SCHEMA IF EXISTS vault;
DROP SCHEMA IF EXISTS storage;
DROP SCHEMA IF EXISTS realtime;
DROP SCHEMA IF EXISTS pgbouncer;
DROP SCHEMA IF EXISTS graphql_public;
DROP SCHEMA IF EXISTS graphql;
DROP SCHEMA IF EXISTS extensions;
DROP SCHEMA IF EXISTS auth;
--
-- TOC entry 37 (class 2615 OID 16494)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- TOC entry 23 (class 2615 OID 16388)
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- TOC entry 35 (class 2615 OID 16624)
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- TOC entry 34 (class 2615 OID 16613)
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- TOC entry 12 (class 2615 OID 16386)
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- TOC entry 13 (class 2615 OID 16605)
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- TOC entry 38 (class 2615 OID 16542)
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- TOC entry 32 (class 2615 OID 16653)
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- TOC entry 6 (class 3079 OID 16689)
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- TOC entry 4557 (class 0 OID 0)
-- Dependencies: 6
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- TOC entry 2 (class 3079 OID 16389)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- TOC entry 4558 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- TOC entry 4 (class 3079 OID 16443)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- TOC entry 4559 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 5 (class 3079 OID 16654)
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- TOC entry 4560 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- TOC entry 3 (class 3079 OID 16432)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- TOC entry 4561 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1142 (class 1247 OID 16784)
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- TOC entry 1166 (class 1247 OID 16925)
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- TOC entry 1139 (class 1247 OID 16778)
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- TOC entry 1136 (class 1247 OID 16773)
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- TOC entry 1184 (class 1247 OID 17028)
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- TOC entry 1196 (class 1247 OID 17101)
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- TOC entry 1178 (class 1247 OID 17006)
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- TOC entry 1187 (class 1247 OID 17038)
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- TOC entry 1172 (class 1247 OID 16967)
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- TOC entry 1268 (class 1247 OID 17550)
-- Name: AccountStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccountStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'NEEDS_CLARIFICATION'
);


--
-- TOC entry 1271 (class 1247 OID 17560)
-- Name: AccountType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccountType" AS ENUM (
    'SAVINGS',
    'CURRENT'
);


--
-- TOC entry 1241 (class 1247 OID 17452)
-- Name: BoardType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BoardType" AS ENUM (
    'KANBAN',
    'SCRUM'
);


--
-- TOC entry 1265 (class 1247 OID 17542)
-- Name: ClientStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ClientStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PROSPECT'
);


--
-- TOC entry 1253 (class 1247 OID 17500)
-- Name: InvoiceRecurrence; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InvoiceRecurrence" AS ENUM (
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'YEARLY'
);


--
-- TOC entry 1247 (class 1247 OID 17480)
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED'
);


--
-- TOC entry 1259 (class 1247 OID 17520)
-- Name: IssuePriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."IssuePriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- TOC entry 1256 (class 1247 OID 17510)
-- Name: IssueStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."IssueStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


--
-- TOC entry 1367 (class 1247 OID 20552)
-- Name: OrganisationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrganisationStatus" AS ENUM (
    'PROSPECT',
    'ACTIVE',
    'INACTIVE'
);


--
-- TOC entry 1364 (class 1247 OID 20547)
-- Name: OrganisationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrganisationType" AS ENUM (
    'OWNER',
    'CLIENT'
);


--
-- TOC entry 1250 (class 1247 OID 17490)
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'UPI',
    'BANK_TRANSFER',
    'CASH',
    'CARD'
);


--
-- TOC entry 1262 (class 1247 OID 17530)
-- Name: ProjectStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ProjectStatus" AS ENUM (
    'PLANNING',
    'ACTIVE',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED'
);


--
-- TOC entry 1337 (class 1247 OID 18043)
-- Name: ProposalStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ProposalStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'VIEWED',
    'ACCEPTED',
    'REJECTED',
    'CONVERTED_TO_INVOICE'
);


--
-- TOC entry 1274 (class 1247 OID 17566)
-- Name: SettlementSchedule; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SettlementSchedule" AS ENUM (
    'INSTANT',
    'DAILY',
    'WEEKLY',
    'MONTHLY'
);


--
-- TOC entry 1238 (class 1247 OID 17458)
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


--
-- TOC entry 1244 (class 1247 OID 17468)
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'TODO',
    'IN_PROGRESS',
    'IN_REVIEW',
    'DONE',
    'BLOCKED'
);


--
-- TOC entry 1340 (class 1247 OID 18056)
-- Name: UpdateStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UpdateStatus" AS ENUM (
    'DRAFT',
    'SCHEDULED',
    'SENT',
    'DELIVERED'
);


--
-- TOC entry 1226 (class 1247 OID 17312)
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- TOC entry 1211 (class 1247 OID 17231)
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- TOC entry 1214 (class 1247 OID 17245)
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- TOC entry 1232 (class 1247 OID 17354)
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- TOC entry 1229 (class 1247 OID 17325)
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- TOC entry 1220 (class 1247 OID 17270)
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS'
);


--
-- TOC entry 420 (class 1255 OID 16540)
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- TOC entry 4562 (class 0 OID 0)
-- Dependencies: 420
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- TOC entry 439 (class 1255 OID 16755)
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- TOC entry 419 (class 1255 OID 16539)
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- TOC entry 4563 (class 0 OID 0)
-- Dependencies: 419
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- TOC entry 418 (class 1255 OID 16538)
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- TOC entry 4564 (class 0 OID 0)
-- Dependencies: 418
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- TOC entry 421 (class 1255 OID 16597)
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- TOC entry 4565 (class 0 OID 0)
-- Dependencies: 421
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- TOC entry 425 (class 1255 OID 16618)
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- TOC entry 4566 (class 0 OID 0)
-- Dependencies: 425
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- TOC entry 422 (class 1255 OID 16599)
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- TOC entry 4567 (class 0 OID 0)
-- Dependencies: 422
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- TOC entry 423 (class 1255 OID 16609)
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- TOC entry 424 (class 1255 OID 16610)
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- TOC entry 426 (class 1255 OID 16620)
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- TOC entry 4568 (class 0 OID 0)
-- Dependencies: 426
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- TOC entry 368 (class 1255 OID 16387)
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- TOC entry 474 (class 1255 OID 17347)
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- TOC entry 480 (class 1255 OID 17430)
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- TOC entry 476 (class 1255 OID 17359)
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- TOC entry 472 (class 1255 OID 17309)
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- TOC entry 471 (class 1255 OID 17304)
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- TOC entry 475 (class 1255 OID 17355)
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- TOC entry 477 (class 1255 OID 17370)
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- TOC entry 470 (class 1255 OID 17303)
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- TOC entry 479 (class 1255 OID 17429)
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- TOC entry 469 (class 1255 OID 17301)
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- TOC entry 473 (class 1255 OID 17336)
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- TOC entry 478 (class 1255 OID 17423)
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- TOC entry 452 (class 1255 OID 17219)
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


--
-- TOC entry 445 (class 1255 OID 17145)
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- TOC entry 464 (class 1255 OID 17289)
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


--
-- TOC entry 453 (class 1255 OID 17220)
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


--
-- TOC entry 456 (class 1255 OID 17223)
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


--
-- TOC entry 461 (class 1255 OID 17267)
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- TOC entry 442 (class 1255 OID 17119)
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- TOC entry 441 (class 1255 OID 17118)
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- TOC entry 440 (class 1255 OID 17117)
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- TOC entry 449 (class 1255 OID 17201)
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


--
-- TOC entry 450 (class 1255 OID 17217)
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


--
-- TOC entry 451 (class 1255 OID 17218)
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


--
-- TOC entry 459 (class 1255 OID 17265)
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- TOC entry 447 (class 1255 OID 17184)
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- TOC entry 446 (class 1255 OID 17147)
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- TOC entry 463 (class 1255 OID 17288)
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


--
-- TOC entry 465 (class 1255 OID 17290)
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


--
-- TOC entry 455 (class 1255 OID 17222)
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- TOC entry 466 (class 1255 OID 17291)
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


--
-- TOC entry 468 (class 1255 OID 17296)
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_level_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


--
-- TOC entry 460 (class 1255 OID 17266)
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- TOC entry 448 (class 1255 OID 17200)
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- TOC entry 467 (class 1255 OID 17292)
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


--
-- TOC entry 454 (class 1255 OID 17221)
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


--
-- TOC entry 443 (class 1255 OID 17134)
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


--
-- TOC entry 458 (class 1255 OID 17263)
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- TOC entry 457 (class 1255 OID 17262)
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- TOC entry 462 (class 1255 OID 17287)
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


--
-- TOC entry 444 (class 1255 OID 17135)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 296 (class 1259 OID 16525)
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- TOC entry 4569 (class 0 OID 0)
-- Dependencies: 296
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- TOC entry 313 (class 1259 OID 16929)
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- TOC entry 4570 (class 0 OID 0)
-- Dependencies: 313
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- TOC entry 304 (class 1259 OID 16727)
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- TOC entry 4571 (class 0 OID 0)
-- Dependencies: 304
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- TOC entry 4572 (class 0 OID 0)
-- Dependencies: 304
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- TOC entry 295 (class 1259 OID 16518)
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- TOC entry 4573 (class 0 OID 0)
-- Dependencies: 295
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- TOC entry 308 (class 1259 OID 16816)
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- TOC entry 4574 (class 0 OID 0)
-- Dependencies: 308
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- TOC entry 307 (class 1259 OID 16804)
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- TOC entry 4575 (class 0 OID 0)
-- Dependencies: 307
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- TOC entry 306 (class 1259 OID 16791)
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- TOC entry 4576 (class 0 OID 0)
-- Dependencies: 306
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- TOC entry 4577 (class 0 OID 0)
-- Dependencies: 306
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- TOC entry 316 (class 1259 OID 17041)
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- TOC entry 315 (class 1259 OID 17011)
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048))
);


--
-- TOC entry 317 (class 1259 OID 17074)
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- TOC entry 314 (class 1259 OID 16979)
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- TOC entry 294 (class 1259 OID 16507)
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- TOC entry 4578 (class 0 OID 0)
-- Dependencies: 294
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- TOC entry 293 (class 1259 OID 16506)
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4579 (class 0 OID 0)
-- Dependencies: 293
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- TOC entry 311 (class 1259 OID 16858)
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- TOC entry 4580 (class 0 OID 0)
-- Dependencies: 311
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- TOC entry 312 (class 1259 OID 16876)
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- TOC entry 4581 (class 0 OID 0)
-- Dependencies: 312
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- TOC entry 297 (class 1259 OID 16533)
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- TOC entry 4582 (class 0 OID 0)
-- Dependencies: 297
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- TOC entry 305 (class 1259 OID 16757)
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint
);


--
-- TOC entry 4583 (class 0 OID 0)
-- Dependencies: 305
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- TOC entry 4584 (class 0 OID 0)
-- Dependencies: 305
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- TOC entry 4585 (class 0 OID 0)
-- Dependencies: 305
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- TOC entry 4586 (class 0 OID 0)
-- Dependencies: 305
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- TOC entry 310 (class 1259 OID 16843)
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- TOC entry 4587 (class 0 OID 0)
-- Dependencies: 310
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- TOC entry 309 (class 1259 OID 16834)
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- TOC entry 4588 (class 0 OID 0)
-- Dependencies: 309
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- TOC entry 4589 (class 0 OID 0)
-- Dependencies: 309
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- TOC entry 292 (class 1259 OID 16495)
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- TOC entry 4590 (class 0 OID 0)
-- Dependencies: 292
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- TOC entry 4591 (class 0 OID 0)
-- Dependencies: 292
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- TOC entry 337 (class 1259 OID 17651)
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id text NOT NULL,
    team_id text NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    details jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 343 (class 1259 OID 17706)
-- Name: board_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_activities (
    id text NOT NULL,
    board_id text NOT NULL,
    user_id text NOT NULL,
    action text NOT NULL,
    details jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 339 (class 1259 OID 17670)
-- Name: board_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_lists (
    id text NOT NULL,
    name text NOT NULL,
    board_id text NOT NULL,
    "position" integer NOT NULL,
    color text,
    archived boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 338 (class 1259 OID 17659)
-- Name: boards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.boards (
    id text NOT NULL,
    name text NOT NULL,
    type public."BoardType" DEFAULT 'KANBAN'::public."BoardType" NOT NULL,
    team_id text NOT NULL,
    created_by text NOT NULL,
    settings jsonb,
    "position" integer DEFAULT 0 NOT NULL,
    archived boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    project_id text,
    description text
);


--
-- TOC entry 354 (class 1259 OID 18230)
-- Name: budget_estimations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budget_estimations (
    id text NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    brief text NOT NULL,
    deliverables jsonb NOT NULL,
    timeline jsonb NOT NULL,
    estimated_budget double precision NOT NULL,
    actual_budget double precision,
    confidence text NOT NULL,
    breakdown jsonb NOT NULL,
    rationale text NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    deliverable_count integer NOT NULL,
    timeline_weeks double precision NOT NULL,
    accuracy double precision,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 331 (class 1259 OID 17591)
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    company text,
    address text,
    notes text,
    budget double precision,
    currency text,
    status public."ClientStatus" DEFAULT 'PROSPECT'::public."ClientStatus" NOT NULL,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 350 (class 1259 OID 18077)
-- Name: estimations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estimations (
    id text NOT NULL,
    client_id text,
    project_id text,
    title text NOT NULL,
    description text,
    estimated_hours double precision NOT NULL,
    estimated_cost double precision NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    confidence double precision,
    rationale text NOT NULL,
    suggested_packages jsonb,
    risk_factors jsonb,
    assumptions jsonb,
    similar_projects_count integer DEFAULT 0,
    historical_accuracy double precision,
    ai_model text,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 333 (class 1259 OID 17615)
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id text NOT NULL,
    invoice_id text NOT NULL,
    description text NOT NULL,
    quantity integer NOT NULL,
    rate double precision NOT NULL,
    total double precision DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 332 (class 1259 OID 17600)
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id text NOT NULL,
    "invoiceNumber" text NOT NULL,
    client_id text NOT NULL,
    issued_by_id text NOT NULL,
    due_date timestamp(3) without time zone NOT NULL,
    issued_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."InvoiceStatus" DEFAULT 'PENDING'::public."InvoiceStatus" NOT NULL,
    "paymentMethod" public."PaymentMethod",
    notes text,
    tax_rate double precision,
    discount double precision DEFAULT 0,
    currency text DEFAULT 'INR'::text NOT NULL,
    pdf_url text,
    is_recurring boolean DEFAULT false NOT NULL,
    recurrence public."InvoiceRecurrence",
    next_issue_date timestamp(3) without time zone,
    last_sent_date timestamp(3) without time zone,
    reminder_sent boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    enable_payment_link boolean DEFAULT false NOT NULL,
    e_signature_url text,
    watermark_text text,
    razorpay_payment_link_id text,
    razorpay_payment_link_url text,
    razorpay_payment_link_status text,
    razorpay_payment_id text,
    razorpay_order_id text,
    auto_generate_enabled boolean DEFAULT true NOT NULL,
    auto_send_enabled boolean DEFAULT false NOT NULL,
    max_occurrences integer,
    occurrence_count integer DEFAULT 0 NOT NULL,
    parent_invoice_id text,
    recipient_emails text[] DEFAULT ARRAY[]::text[],
    send_day_of_period integer
);


--
-- TOC entry 347 (class 1259 OID 17741)
-- Name: issue_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_comments (
    id text NOT NULL,
    issue_id text NOT NULL,
    user_id text NOT NULL,
    content text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 346 (class 1259 OID 17731)
-- Name: issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issues (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status public."IssueStatus" DEFAULT 'OPEN'::public."IssueStatus" NOT NULL,
    priority public."IssuePriority" DEFAULT 'MEDIUM'::public."IssuePriority" NOT NULL,
    project_id text,
    board_id text,
    task_id text,
    assigned_to text,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 355 (class 1259 OID 18259)
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    activity_id text NOT NULL,
    read_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 356 (class 1259 OID 20559)
-- Name: organisations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organisations (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    budget double precision,
    currency text DEFAULT 'INR'::text,
    status public."OrganisationStatus" DEFAULT 'ACTIVE'::public."OrganisationStatus" NOT NULL,
    type public."OrganisationType" DEFAULT 'OWNER'::public."OrganisationType" NOT NULL,
    notes text,
    logo_url text,
    website text,
    address text,
    city text,
    state text,
    country text DEFAULT 'India'::text,
    pincode text,
    owner_id text NOT NULL,
    max_projects integer DEFAULT 5 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 348 (class 1259 OID 17749)
-- Name: payment_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_settings (
    id text NOT NULL,
    user_id text NOT NULL,
    razorpay_account_id text,
    account_status public."AccountStatus" DEFAULT 'PENDING'::public."AccountStatus" NOT NULL,
    account_holder_name text,
    account_number text,
    ifsc_code text,
    bank_name text,
    branch_name text,
    account_type public."AccountType",
    pan_number text,
    business_name text,
    gst_number text,
    contact_email text,
    contact_phone text,
    business_address text,
    city text,
    state text,
    pincode text,
    country text DEFAULT 'India'::text,
    enable_commission boolean DEFAULT true NOT NULL,
    commission_percent double precision DEFAULT 5.0,
    settlement_schedule public."SettlementSchedule" DEFAULT 'INSTANT'::public."SettlementSchedule" NOT NULL,
    account_active boolean DEFAULT false NOT NULL,
    verification_notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 345 (class 1259 OID 17722)
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    client_id text,
    team_id text NOT NULL,
    status public."ProjectStatus" DEFAULT 'PLANNING'::public."ProjectStatus" NOT NULL,
    goal integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    completed_tasks integer,
    end_date timestamp(3) without time zone,
    organisation_id text,
    start_date timestamp(3) without time zone
);


--
-- TOC entry 349 (class 1259 OID 18065)
-- Name: proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposals (
    id text NOT NULL,
    client_id text NOT NULL,
    project_id text,
    title text NOT NULL,
    brief text NOT NULL,
    deliverables jsonb NOT NULL,
    timeline jsonb NOT NULL,
    pricing double precision NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    payment_terms text,
    status public."ProposalStatus" DEFAULT 'DRAFT'::public."ProposalStatus" NOT NULL,
    is_change_order boolean DEFAULT false NOT NULL,
    parent_proposal_id text,
    change_reason text,
    pdf_url text,
    e_signature_url text,
    signed_at timestamp(3) without time zone,
    signed_by_name text,
    generated_by_ai boolean DEFAULT true NOT NULL,
    ai_prompt text,
    ai_model text,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    accepted_at timestamp(3) without time zone,
    expires_at timestamp(3) without time zone,
    rejected_at timestamp(3) without time zone,
    section_blocks jsonb,
    sent_at timestamp(3) without time zone,
    sent_to text,
    template_id text,
    access_token text,
    last_viewed_at timestamp(3) without time zone,
    token_expires_at timestamp(3) without time zone,
    view_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 352 (class 1259 OID 18097)
-- Name: scope_radar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scope_radar (
    id text NOT NULL,
    project_id text NOT NULL,
    creep_risk double precision NOT NULL,
    revision_count integer DEFAULT 0 NOT NULL,
    out_of_scope_count integer DEFAULT 0 NOT NULL,
    flagged_items jsonb NOT NULL,
    patterns jsonb,
    recommendations jsonb,
    change_order_draft text,
    estimated_impact jsonb,
    acknowledged boolean DEFAULT false NOT NULL,
    acknowledged_at timestamp(3) without time zone,
    ai_model text,
    flagged_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    budget_overrun double precision,
    budget_overrun_percent double precision,
    client_email_draft text,
    current_estimate double precision,
    email_sent boolean DEFAULT false NOT NULL,
    email_sent_at timestamp(3) without time zone,
    original_budget double precision
);


--
-- TOC entry 353 (class 1259 OID 18162)
-- Name: signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signatures (
    id text NOT NULL,
    proposal_id text NOT NULL,
    signer_name text NOT NULL,
    signer_email text NOT NULL,
    signer_title text,
    signature_blob text NOT NULL,
    signature_type text DEFAULT 'draw'::text NOT NULL,
    signed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address text,
    user_agent text
);


--
-- TOC entry 330 (class 1259 OID 17583)
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    user_id text NOT NULL,
    stripe_price_id text NOT NULL,
    stripe_subscription_id text NOT NULL,
    current_period_end timestamp(3) without time zone NOT NULL,
    status text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 344 (class 1259 OID 17714)
-- Name: task_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_activities (
    id text NOT NULL,
    task_id text NOT NULL,
    user_id text NOT NULL,
    action text NOT NULL,
    details jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 342 (class 1259 OID 17698)
-- Name: task_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_attachments (
    id text NOT NULL,
    task_id text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    uploaded_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 341 (class 1259 OID 17690)
-- Name: task_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_comments (
    id text NOT NULL,
    task_id text NOT NULL,
    user_id text NOT NULL,
    content text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 340 (class 1259 OID 17679)
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    title text NOT NULL,
    board_id text NOT NULL,
    list_id text NOT NULL,
    assigned_to text,
    created_by text NOT NULL,
    priority public."TaskPriority" DEFAULT 'MEDIUM'::public."TaskPriority" NOT NULL,
    status public."TaskStatus" DEFAULT 'TODO'::public."TaskStatus" NOT NULL,
    "position" integer NOT NULL,
    due_date timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    estimated_hours integer,
    actual_hours integer,
    tags text[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    archived boolean DEFAULT false NOT NULL,
    description text NOT NULL
);


--
-- TOC entry 336 (class 1259 OID 17642)
-- Name: team_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_invites (
    id text NOT NULL,
    team_id text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    token text NOT NULL,
    invited_by text NOT NULL,
    used_at timestamp(3) without time zone,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 335 (class 1259 OID 17632)
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id text NOT NULL,
    team_id text NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    added_by text NOT NULL,
    accepted_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 334 (class 1259 OID 17624)
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 351 (class 1259 OID 18087)
-- Name: update_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.update_drafts (
    id text NOT NULL,
    week_start timestamp(3) without time zone NOT NULL,
    client_id text NOT NULL,
    project_id text,
    summary text NOT NULL,
    accomplishments jsonb NOT NULL,
    blockers jsonb,
    next_steps jsonb NOT NULL,
    metrics jsonb,
    status public."UpdateStatus" DEFAULT 'DRAFT'::public."UpdateStatus" NOT NULL,
    sent_at timestamp(3) without time zone,
    sent_to text,
    generated_by_ai boolean DEFAULT true NOT NULL,
    ai_model text,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 329 (class 1259 OID 17575)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    display_name text,
    avatar_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    stripe_customer_id text
);


--
-- TOC entry 328 (class 1259 OID 17433)
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- TOC entry 318 (class 1259 OID 17112)
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- TOC entry 324 (class 1259 OID 17247)
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- TOC entry 323 (class 1259 OID 17246)
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 298 (class 1259 OID 16546)
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- TOC entry 4592 (class 0 OID 0)
-- Dependencies: 298
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 325 (class 1259 OID 17276)
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 300 (class 1259 OID 16588)
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 299 (class 1259 OID 16561)
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


--
-- TOC entry 4593 (class 0 OID 0)
-- Dependencies: 299
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 321 (class 1259 OID 17202)
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 319 (class 1259 OID 17149)
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- TOC entry 320 (class 1259 OID 17163)
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3775 (class 2604 OID 16510)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 4498 (class 0 OID 16525)
-- Dependencies: 296
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- TOC entry 4512 (class 0 OID 16929)
-- Dependencies: 313
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
9e6538ba-ed34-4419-8c42-bd54d6067c0e	dff17b82-13a7-4820-9632-db590622825f	5c66a9ac-89c7-4d13-958e-63b2c390728d	s256	m5fcgujP8MRTGDfKYQe8w16j7n_zaERaP4dn7DSou_0	email			2025-11-11 15:28:27.024602+00	2025-11-11 15:28:49.397178+00	email/signup	2025-11-11 15:28:49.397138+00
666c9aea-83a6-4001-bde1-3508ea45bdab	\N	74a59f99-3481-49e5-b7ca-58e73cb75ead	s256	zDft8aDrZPpo5JoiROVcTHK63VHDn0arSE0R9Ombn3g	google			2025-11-11 16:31:38.522525+00	2025-11-11 16:31:38.522525+00	oauth	\N
3f7e57ab-2d81-4137-8132-aebfb44090f8	\N	af047f14-7888-4766-89c0-f61dbfd9bae7	s256	EKffCdQZMddqI_Q2os28Ti_vxVAwCJqzCa47pqSahto	github			2025-11-11 16:43:13.899663+00	2025-11-11 16:43:13.899663+00	oauth	\N
\.


--
-- TOC entry 4503 (class 0 OID 16727)
-- Dependencies: 304
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
36661deb-c5d1-4d65-a6a4-e4413b6e19fc	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	{"sub": "36661deb-c5d1-4d65-a6a4-e4413b6e19fc", "email": "certainlymohneesh@gmail.com", "displayName": "Mohneesh Naidu", "display_name": "Mohneesh Naidu", "email_verified": true, "phone_verified": false}	email	2025-11-10 03:50:01.255245+00	2025-11-10 03:50:01.255298+00	2025-11-10 03:50:01.255298+00	2f19e819-9349-42c5-8b5e-45c6b8b2957c
5cccba40-2316-4748-a31b-95b77fbc67f2	5cccba40-2316-4748-a31b-95b77fbc67f2	{"sub": "5cccba40-2316-4748-a31b-95b77fbc67f2", "email": "vaxis81719@fergetic.com", "displayName": "TEST USER", "display_name": "TEST USER", "email_verified": true, "phone_verified": false}	email	2025-11-10 04:03:33.225691+00	2025-11-10 04:03:33.225744+00	2025-11-10 04:03:33.225744+00	7bdfdddd-fa9c-42df-ab3b-faa2e215d910
dff17b82-13a7-4820-9632-db590622825f	dff17b82-13a7-4820-9632-db590622825f	{"sub": "dff17b82-13a7-4820-9632-db590622825f", "email": "mgnaidu_b22@tx.vjti.ac.in", "displayName": "MG Naidu", "display_name": "MG Naidu", "email_verified": true, "phone_verified": false}	email	2025-11-11 15:28:26.994783+00	2025-11-11 15:28:26.995439+00	2025-11-11 15:28:26.995439+00	1dbb7518-1826-435a-850d-b48abf63f726
115948842644454182453	0874fd0a-2809-4832-bcca-0d6290003589	{"iss": "https://accounts.google.com", "sub": "115948842644454182453", "name": "Mohneesh “Chemical myth” Naidu", "email": "2203chemicalmyth@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocK1nnwhkp6Lgv1ocBnAasJD4Lt1IIVeG3g5ATkMrCqz87n65Yu9=s96-c", "full_name": "Mohneesh “Chemical myth” Naidu", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocK1nnwhkp6Lgv1ocBnAasJD4Lt1IIVeG3g5ATkMrCqz87n65Yu9=s96-c", "provider_id": "115948842644454182453", "email_verified": true, "phone_verified": false}	google	2025-11-11 16:43:40.420993+00	2025-11-11 16:43:40.421056+00	2025-11-11 18:14:12.739266+00	69f3db20-f115-48c1-981f-31be237a5749
\.


--
-- TOC entry 4497 (class 0 OID 16518)
-- Dependencies: 295
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4507 (class 0 OID 16816)
-- Dependencies: 308
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
341bcf7d-5182-4cf0-97a9-9b1f0eb607e6	2025-11-10 04:04:12.513643+00	2025-11-10 04:04:12.513643+00	otp	61885fe8-bd87-44e8-bee8-ffe36778bbf2
38658053-d323-4ace-8921-ff4ada3ba6dc	2025-11-11 15:29:09.257964+00	2025-11-11 15:29:09.257964+00	password	5c9c16dc-e85f-433d-8d21-4fbe61957218
0421ab7e-9235-48ef-b068-1488d7653271	2025-11-11 18:03:22.754118+00	2025-11-11 18:03:22.754118+00	otp	a1fbd26c-78ed-43b8-93f3-93a137d09d77
1a6b6410-c14c-4117-82c6-7371731121ae	2025-11-11 18:08:13.758442+00	2025-11-11 18:08:13.758442+00	oauth	2a2898bf-c4c5-472d-bc50-a66ff19cb3d9
7a39d839-37b2-45e9-a515-8e8d017b4a7b	2025-11-11 18:08:38.09303+00	2025-11-11 18:08:38.09303+00	password	c3d38de2-e6b9-4a8f-988d-e8eb4b227a31
35869065-6f11-45ce-911a-81836fef3411	2025-11-11 18:14:13.402056+00	2025-11-11 18:14:13.402056+00	oauth	5f27d3a8-bd86-4251-821b-7b65854808af
527c1808-6ff8-4e32-bfce-8a57752c055a	2025-11-11 18:16:25.386951+00	2025-11-11 18:16:25.386951+00	password	ac803f6e-be01-4418-a14c-fe0501c6ef57
3e21ae51-e1e5-4706-b146-321648a57a4e	2025-11-12 11:59:10.857321+00	2025-11-12 11:59:10.857321+00	password	f6b17b07-300d-44c8-9850-5811634cc53d
\.


--
-- TOC entry 4506 (class 0 OID 16804)
-- Dependencies: 307
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- TOC entry 4505 (class 0 OID 16791)
-- Dependencies: 306
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- TOC entry 4515 (class 0 OID 17041)
-- Dependencies: 316
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at) FROM stdin;
\.


--
-- TOC entry 4514 (class 0 OID 17011)
-- Dependencies: 315
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type) FROM stdin;
\.


--
-- TOC entry 4516 (class 0 OID 17074)
-- Dependencies: 317
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- TOC entry 4513 (class 0 OID 16979)
-- Dependencies: 314
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4496 (class 0 OID 16507)
-- Dependencies: 294
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	44	4rguamns37cj	dff17b82-13a7-4820-9632-db590622825f	t	2025-11-11 15:29:09.229884+00	2025-11-11 16:27:12.347304+00	\N	38658053-d323-4ace-8921-ff4ada3ba6dc
00000000-0000-0000-0000-000000000000	4	jzy7h7gycrvy	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 04:04:12.510361+00	2025-11-10 05:02:26.409325+00	\N	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	6	lh2ayejpschu	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 05:02:26.42197+00	2025-11-10 06:00:56.840169+00	jzy7h7gycrvy	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	47	a6e6ypvzf4wc	dff17b82-13a7-4820-9632-db590622825f	t	2025-11-11 16:27:12.371572+00	2025-11-11 17:25:42.671696+00	4rguamns37cj	38658053-d323-4ace-8921-ff4ada3ba6dc
00000000-0000-0000-0000-000000000000	7	kmdsnkkyv4ur	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 06:00:56.865484+00	2025-11-10 06:59:26.84134+00	lh2ayejpschu	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	53	5dehbs5djnlc	dff17b82-13a7-4820-9632-db590622825f	f	2025-11-11 17:25:42.689218+00	2025-11-11 17:25:42.689218+00	a6e6ypvzf4wc	38658053-d323-4ace-8921-ff4ada3ba6dc
00000000-0000-0000-0000-000000000000	13	22faaauc4fde	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 06:59:26.850689+00	2025-11-10 07:57:56.883753+00	kmdsnkkyv4ur	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	15	jprzrllsnd4y	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 07:57:56.88724+00	2025-11-10 08:56:27.331584+00	22faaauc4fde	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	16	q6rblr3tch5n	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 08:56:27.355801+00	2025-11-10 09:54:56.717395+00	jprzrllsnd4y	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	57	ktfgddiebkx4	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	f	2025-11-11 18:03:22.739052+00	2025-11-11 18:03:22.739052+00	\N	0421ab7e-9235-48ef-b068-1488d7653271
00000000-0000-0000-0000-000000000000	17	vulbrdvz3tqo	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 09:54:56.732386+00	2025-11-10 10:53:27.472941+00	q6rblr3tch5n	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	18	ryveotdp4tac	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 10:53:27.489613+00	2025-11-10 11:51:57.304127+00	vulbrdvz3tqo	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	59	twn4kofxee5w	0874fd0a-2809-4832-bcca-0d6290003589	f	2025-11-11 18:08:13.75645+00	2025-11-11 18:08:13.75645+00	\N	1a6b6410-c14c-4117-82c6-7371731121ae
00000000-0000-0000-0000-000000000000	60	zml447l5prr4	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	f	2025-11-11 18:08:38.091802+00	2025-11-11 18:08:38.091802+00	\N	7a39d839-37b2-45e9-a515-8e8d017b4a7b
00000000-0000-0000-0000-000000000000	19	2dou6gi4alh3	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 11:51:57.318499+00	2025-11-10 12:50:25.891777+00	ryveotdp4tac	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	62	agxyt4fhe464	dff17b82-13a7-4820-9632-db590622825f	f	2025-11-11 18:16:25.385633+00	2025-11-11 18:16:25.385633+00	\N	527c1808-6ff8-4e32-bfce-8a57752c055a
00000000-0000-0000-0000-000000000000	61	fk7bn5id5s7d	0874fd0a-2809-4832-bcca-0d6290003589	t	2025-11-11 18:14:13.397324+00	2025-11-12 11:58:13.966456+00	\N	35869065-6f11-45ce-911a-81836fef3411
00000000-0000-0000-0000-000000000000	63	wmwjh7ak6e2b	0874fd0a-2809-4832-bcca-0d6290003589	f	2025-11-12 11:58:13.996501+00	2025-11-12 11:58:13.996501+00	fk7bn5id5s7d	35869065-6f11-45ce-911a-81836fef3411
00000000-0000-0000-0000-000000000000	64	yccmvjdpk2gi	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	t	2025-11-12 11:59:10.854207+00	2025-11-12 12:57:22.456024+00	\N	3e21ae51-e1e5-4706-b146-321648a57a4e
00000000-0000-0000-0000-000000000000	21	tnirjpsz4y55	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 12:50:25.892588+00	2025-11-10 13:48:25.832871+00	2dou6gi4alh3	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	24	gx57jlvvgvg4	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 13:48:25.833297+00	2025-11-10 14:46:27.084688+00	tnirjpsz4y55	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	65	5grqmui2pav5	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	t	2025-11-12 12:57:22.476582+00	2025-11-12 13:55:26.940936+00	yccmvjdpk2gi	3e21ae51-e1e5-4706-b146-321648a57a4e
00000000-0000-0000-0000-000000000000	25	4lzav6hozyrp	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 14:46:27.10856+00	2025-11-10 15:44:56.706846+00	gx57jlvvgvg4	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	26	vytgdbb4tzze	5cccba40-2316-4748-a31b-95b77fbc67f2	t	2025-11-10 15:44:56.725169+00	2025-11-10 16:43:26.668444+00	4lzav6hozyrp	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	27	cpetp2pxspzw	5cccba40-2316-4748-a31b-95b77fbc67f2	f	2025-11-10 16:43:26.680806+00	2025-11-10 16:43:26.680806+00	vytgdbb4tzze	341bcf7d-5182-4cf0-97a9-9b1f0eb607e6
00000000-0000-0000-0000-000000000000	66	lsvf7r3uibh7	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	t	2025-11-12 13:55:26.973278+00	2025-11-12 14:53:27.16894+00	5grqmui2pav5	3e21ae51-e1e5-4706-b146-321648a57a4e
00000000-0000-0000-0000-000000000000	67	r5wsnocmrkfy	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	t	2025-11-12 14:53:27.179804+00	2025-11-12 15:51:57.161835+00	lsvf7r3uibh7	3e21ae51-e1e5-4706-b146-321648a57a4e
00000000-0000-0000-0000-000000000000	68	56fr46275jwl	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	f	2025-11-12 15:51:57.175918+00	2025-11-12 15:51:57.175918+00	r5wsnocmrkfy	3e21ae51-e1e5-4706-b146-321648a57a4e
\.


--
-- TOC entry 4510 (class 0 OID 16858)
-- Dependencies: 311
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- TOC entry 4511 (class 0 OID 16876)
-- Dependencies: 312
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- TOC entry 4499 (class 0 OID 16533)
-- Dependencies: 297
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
\.


--
-- TOC entry 4504 (class 0 OID 16757)
-- Dependencies: 305
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter) FROM stdin;
3e21ae51-e1e5-4706-b146-321648a57a4e	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-12 11:59:10.841679+00	2025-11-12 15:51:57.191746+00	\N	aal1	\N	2025-11-12 15:51:57.191646	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	183.87.195.147	\N	\N	\N	\N
341bcf7d-5182-4cf0-97a9-9b1f0eb607e6	5cccba40-2316-4748-a31b-95b77fbc67f2	2025-11-10 04:04:12.509159+00	2025-11-10 16:43:26.698426+00	\N	aal1	\N	2025-11-10 16:43:26.697765	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	183.87.195.147	\N	\N	\N	\N
38658053-d323-4ace-8921-ff4ada3ba6dc	dff17b82-13a7-4820-9632-db590622825f	2025-11-11 15:29:09.215984+00	2025-11-11 17:25:42.707105+00	\N	aal1	\N	2025-11-11 17:25:42.707002	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	183.87.195.147	\N	\N	\N	\N
0421ab7e-9235-48ef-b068-1488d7653271	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-11 18:03:22.708098+00	2025-11-11 18:03:22.708098+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	183.87.195.147	\N	\N	\N	\N
1a6b6410-c14c-4117-82c6-7371731121ae	0874fd0a-2809-4832-bcca-0d6290003589	2025-11-11 18:08:13.754919+00	2025-11-11 18:08:13.754919+00	\N	aal1	\N	\N	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	183.87.195.147	\N	\N	\N	\N
7a39d839-37b2-45e9-a515-8e8d017b4a7b	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-11 18:08:38.090822+00	2025-11-11 18:08:38.090822+00	\N	aal1	\N	\N	node	183.87.195.147	\N	\N	\N	\N
527c1808-6ff8-4e32-bfce-8a57752c055a	dff17b82-13a7-4820-9632-db590622825f	2025-11-11 18:16:25.384505+00	2025-11-11 18:16:25.384505+00	\N	aal1	\N	\N	node	183.87.195.147	\N	\N	\N	\N
35869065-6f11-45ce-911a-81836fef3411	0874fd0a-2809-4832-bcca-0d6290003589	2025-11-11 18:14:13.39135+00	2025-11-12 11:58:14.026131+00	\N	aal1	\N	2025-11-12 11:58:14.026027	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	183.87.195.147	\N	\N	\N	\N
\.


--
-- TOC entry 4509 (class 0 OID 16843)
-- Dependencies: 310
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4508 (class 0 OID 16834)
-- Dependencies: 309
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- TOC entry 4494 (class 0 OID 16495)
-- Dependencies: 292
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	dff17b82-13a7-4820-9632-db590622825f	authenticated	authenticated	mgnaidu_b22@tx.vjti.ac.in	$2a$10$oWOqWfXNXcqsMQDxwuq0qe3qirdr040DR2dkEnix2kBgWpJz/gZF2	2025-11-11 15:28:49.387138+00	\N		2025-11-11 15:28:27.053631+00		\N			\N	2025-11-11 18:16:25.384403+00	{"provider": "email", "providers": ["email"]}	{"sub": "dff17b82-13a7-4820-9632-db590622825f", "email": "mgnaidu_b22@tx.vjti.ac.in", "displayName": "MG Naidu", "display_name": "MG Naidu", "email_verified": true, "phone_verified": false}	\N	2025-11-11 15:28:26.927475+00	2025-11-11 18:16:25.386602+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0874fd0a-2809-4832-bcca-0d6290003589	authenticated	authenticated	2203chemicalmyth@gmail.com	\N	2025-11-11 16:43:40.426446+00	\N		\N		\N			\N	2025-11-11 18:14:13.391228+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "115948842644454182453", "name": "Mohneesh “Chemical myth” Naidu", "email": "2203chemicalmyth@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocK1nnwhkp6Lgv1ocBnAasJD4Lt1IIVeG3g5ATkMrCqz87n65Yu9=s96-c", "full_name": "Mohneesh “Chemical myth” Naidu", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocK1nnwhkp6Lgv1ocBnAasJD4Lt1IIVeG3g5ATkMrCqz87n65Yu9=s96-c", "provider_id": "115948842644454182453", "email_verified": true, "phone_verified": false}	\N	2025-11-11 16:43:40.403968+00	2025-11-12 11:58:14.014453+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	5cccba40-2316-4748-a31b-95b77fbc67f2	authenticated	authenticated	vaxis81719@fergetic.com	$2a$10$Y1ITxV/3p/Uy1LHIqReaTufXsUDh8ejQunRWeyKC/pFZMs/nkpZFq	2025-11-10 04:04:12.505149+00	\N		2025-11-10 04:03:33.229373+00		\N			\N	2025-11-10 04:04:12.509058+00	{"provider": "email", "providers": ["email"]}	{"sub": "5cccba40-2316-4748-a31b-95b77fbc67f2", "email": "vaxis81719@fergetic.com", "displayName": "TEST USER", "display_name": "TEST USER", "email_verified": true, "phone_verified": false}	\N	2025-11-10 04:03:33.216596+00	2025-11-10 16:43:26.689253+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	authenticated	authenticated	certainlymohneesh@gmail.com	$2a$10$SWTz5/4nrY0bqVIRdynzce4NL1NSPAEyY3bD9UpTfRRH.bW6SEFkO	2025-11-10 03:50:59.056666+00	\N		\N		\N			\N	2025-11-12 11:59:10.841576+00	{"provider": "email", "providers": ["email"]}	{"sub": "36661deb-c5d1-4d65-a6a4-e4413b6e19fc", "email": "certainlymohneesh@gmail.com", "displayName": "Mohneesh Naidu", "display_name": "Mohneesh Naidu", "email_verified": true, "phone_verified": false}	\N	2025-11-10 03:50:01.234494+00	2025-11-12 15:51:57.18564+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- TOC entry 4532 (class 0 OID 17651)
-- Dependencies: 337
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activities (id, team_id, user_id, type, title, details, created_at) FROM stdin;
cmhsmc7ae0003il8z4unrkcuy	cmhsmc7990001il8zioqr0yv5	5cccba40-2316-4748-a31b-95b77fbc67f2	TEAM_CREATED	Created team "COOLED"	\N	2025-11-10 04:04:43.622
cmhsmf4eq0007il8zutdm1z2z	cmhsmf4dn0005il8zshfcubr1	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	TEAM_CREATED	Created team "google"	\N	2025-11-10 04:06:59.858
cmhsmfnuq000bil8zom7v0iub	cmhsmf4dn0005il8zshfcubr1	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	MEMBER_INVITED	Invited vaxis81719@fergetic.com to join the team	\N	2025-11-10 04:07:25.058
cmhsmgqpc000fil8zf79crzn3	cmhsmf4dn0005il8zshfcubr1	5cccba40-2316-4748-a31b-95b77fbc67f2	MEMBER_JOINED	vaxis81719@fergetic.com joined the team	\N	2025-11-10 04:08:15.409
cmhuh7g1s0001ilstwy5ugz29	cmhsmf4dn0005il8zshfcubr1	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	budget_warning	⚠️ Budget warning for TEST PROJECT	{"teamId": "cmhsmf4dn0005il8zshfcubr1", "projectId": "cmhsmktvz000jil8z7t6ndcfv", "riskLevel": "high", "budgetInfo": {"current": 93989.01, "overrun": 0, "currency": "INR", "original": 110000}, "clientName": "TEST CLIENT", "description": "₹16,010.99 remaining • 85% spent", "projectName": "TEST PROJECT", "scopeRadarId": "cmhts5rrv0001ilzvfco8074i"}	2025-11-11 11:16:35.969
cmhujbrxn000uilst8endtaxs	cmhsmf4dn0005il8zshfcubr1	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	budget_exceeded	🚨 Budget exceeded for TEST PROJECT	{"teamId": "cmhsmf4dn0005il8zshfcubr1", "projectId": "cmhsmktvz000jil8z7t6ndcfv", "riskLevel": "critical", "budgetInfo": {"current": 39608388.98999999, "overrun": 36608388.98999999, "currency": "INR", "original": 3000000}, "clientName": "TEST CLIENT", "description": "Over budget by ₹36,608,388.99 • ₹39,608,388.99 / ₹3,000,000", "projectName": "TEST PROJECT", "scopeRadarId": "cmhujbrw0000silstpa7jz53y"}	2025-11-11 12:15:57.228
cmhuvyie20003ilb3eh47jwws	cmhsmf4dn0005il8zshfcubr1	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	MEMBER_INVITED	Invited 2203chemicalmyth@gmail.com to join the team	\N	2025-11-11 18:09:33.339
cmhuvyzoa0009ilb3cv0uricj	cmhsmf4dn0005il8zshfcubr1	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	MEMBER_INVITED	Invited mgnaidu_b22@tx.vjti.ac.in to join the team	\N	2025-11-11 18:09:55.738
cmhuw5l1w000filb3twk2edtg	cmhsmf4dn0005il8zshfcubr1	0874fd0a-2809-4832-bcca-0d6290003589	MEMBER_JOINED	2203chemicalmyth@gmail.com joined the team	\N	2025-11-11 18:15:03.38
cmhuw7f79000zilb3drelfi13	cmhsmf4dn0005il8zshfcubr1	dff17b82-13a7-4820-9632-db590622825f	MEMBER_JOINED	mgnaidu_b22@tx.vjti.ac.in joined the team	\N	2025-11-11 18:16:29.109
\.


--
-- TOC entry 4538 (class 0 OID 17706)
-- Dependencies: 343
-- Data for Name: board_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.board_activities (id, board_id, user_id, action, details, created_at) FROM stdin;
cmhsmmxhr000qil8zlxs7kzts	cmhsmmxgd000lil8zpyayl2vt	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	BOARD_CREATED	{"boardName": "Test Board", "boardType": "KANBAN"}	2025-11-10 04:13:04.143
cmhsmmzyz000sil8z3unfqa0u	cmhsmmxgd000lil8zpyayl2vt	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	BOARD_UPDATED	{"updates": {}}	2025-11-10 04:13:07.356
\.


--
-- TOC entry 4534 (class 0 OID 17670)
-- Dependencies: 339
-- Data for Name: board_lists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.board_lists (id, name, board_id, "position", color, archived, created_at, updated_at) FROM stdin;
cmhsmmxh5000mil8z8qcnbean	To Do	cmhsmmxgd000lil8zpyayl2vt	0	\N	f	2025-11-10 04:13:04.121	2025-11-10 04:13:04.121
cmhsmmxh5000nil8zaehk2uc2	In Progress	cmhsmmxgd000lil8zpyayl2vt	1	\N	f	2025-11-10 04:13:04.121	2025-11-10 04:13:04.121
cmhsmmxh5000oil8zq0whunnp	Done	cmhsmmxgd000lil8zpyayl2vt	2	\N	f	2025-11-10 04:13:04.121	2025-11-10 04:13:04.121
cmhuw4ju80004la04zgwl5bag	To Do	cmhuw4jtm0003la04iqc1rx48	1	#ef4444	f	2025-11-11 18:14:15.153	2025-11-11 18:14:15.153
cmhuw4ju80005la04zgd8n9df	In Progress	cmhuw4jtm0003la04iqc1rx48	2	#f59e0b	f	2025-11-11 18:14:15.153	2025-11-11 18:14:15.153
cmhuw4ju80006la04hgvs37cr	Done	cmhuw4jtm0003la04iqc1rx48	3	#10b981	f	2025-11-11 18:14:15.153	2025-11-11 18:14:15.153
\.


--
-- TOC entry 4533 (class 0 OID 17659)
-- Dependencies: 338
-- Data for Name: boards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.boards (id, name, type, team_id, created_by, settings, "position", archived, created_at, updated_at, project_id, description) FROM stdin;
cmhsmmxgd000lil8zpyayl2vt	Test Board	KANBAN	cmhsmf4dn0005il8zshfcubr1	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	\N	1	f	2025-11-10 04:13:04.093	2025-11-10 04:13:07.307	cmhsmktvz000jil8z7t6ndcfv	test desc
cmhuw4jtm0003la04iqc1rx48	Getting Started	KANBAN	cmhuw4jt50001la04mynifdx0	0874fd0a-2809-4832-bcca-0d6290003589	\N	0	f	2025-11-11 18:14:15.131	2025-11-11 18:14:15.131	\N	Your first board to get started with Nesternity
\.


--
-- TOC entry 4549 (class 0 OID 18230)
-- Dependencies: 354
-- Data for Name: budget_estimations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.budget_estimations (id, user_id, title, brief, deliverables, timeline, estimated_budget, actual_budget, confidence, breakdown, rationale, currency, deliverable_count, timeline_weeks, accuracy, created_at, updated_at) FROM stdin;
cmhto5eux0000iltybtlw83u2	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	AI Proposal for TEST CLIENT	Make a ConvNeXT ML model that analyses the crop disease and gives the EIL level for that region where the crop was located. The purpose of this model is to serve farmers across globe.\n	[{"item": "1. ConvNeXt ML", "timeline": "48 weeks", "description": "1. ConvNeXt ML"}, {"item": "2. The App for that model with Farmer Specific UI", "timeline": "48 weeks", "description": "2. The App for that model with Farmer Specific UI"}, {"item": "3. UX for Farmers", "timeline": "48 weeks", "description": "3. UX for Farmers"}, {"item": "4. The EIL parameter according to all regions", "timeline": "48 weeks", "description": "4. The EIL parameter according to all regions"}]	[{"name": "Project Timeline", "duration": "48 weeks", "deliverables": []}]	42630000	\N	low	[{"amount": 2200000, "category": "Project Management", "reasoning": "Dedicated project manager for coordination, planning, and risk management over the 48-week timeline."}, {"amount": 8600000, "category": "Research & Data Engineering", "reasoning": "Extensive effort required for global crop disease image data collection, annotation, and deep research into EIL parameters for diverse regions and crops, given no historical data. This includes personnel and potential external data licensing."}, {"amount": 8250000, "category": "Machine Learning Development", "reasoning": "Development, training, and optimization of the ConvNeXT model, including experimentation with various datasets and architectures for global applicability."}, {"amount": 4400000, "category": "Backend Development", "reasoning": "Building robust APIs for model integration, user management, data storage, and scalability to serve a global farmer base."}, {"amount": 4400000, "category": "Mobile App Development", "reasoning": "Development of the farmer-specific UI and application for multiple platforms (iOS/Android), ensuring usability and performance."}, {"amount": 2475000, "category": "UX/UI Design", "reasoning": "User research, wireframing, prototyping, and visual design tailored for farmers, focusing on simplicity and accessibility."}, {"amount": 2200000, "category": "Quality Assurance & Testing", "reasoning": "Comprehensive testing of the ML model accuracy, app functionality, usability, and integration across all components."}, {"amount": 3000000, "category": "Infrastructure & Cloud Services", "reasoning": "Significant cloud resources required for training large-scale ML models (GPU compute) and hosting a globally accessible application (hosting, databases, storage, CDN)."}, {"amount": 7105000, "category": "Contingency", "reasoning": "A 20% contingency is included to account for unforeseen challenges, scope adjustments, data acquisition difficulties, and the inherent risks of a project with such broad scope and no historical data."}]	The estimated budget of INR 4,26,30,000 (approximately 4.26 Crores) reflects the high complexity and ambitious scope of the project. Key cost drivers include the extensive data acquisition and annotation required for a global ConvNeXT ML model, the deep research and data collection for EIL parameters across 'all regions,' and the development of a robust, farmer-specific mobile application. The 48-week timeline is aggressive for this scope, necessitating a substantial team across multiple disciplines. The 'low' confidence level stems from the lack of historical data and the extremely broad definitions of 'global farmers' and 'EIL according to all regions,' which introduce significant uncertainty in data-related costs and overall project effort.	INR	4	48	\N	2025-11-10 21:43:12.245	2025-11-10 21:43:12.245
cmhtogjy30001iltykusgaa5o	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	AI Proposal for TEST CLIENT	Make a ConvNeXT ML model that analyses the crop disease and gives the EIL level for that region where the crop was located. The purpose of this model is to serve farmers across globe.\n	[{"item": "1. ConvNeXt ML", "timeline": "48 weeks", "description": "1. ConvNeXt ML"}, {"item": "2. The App for that model with Farmer Specific UI", "timeline": "48 weeks", "description": "2. The App for that model with Farmer Specific UI"}, {"item": "3. UX for Farmers", "timeline": "48 weeks", "description": "3. UX for Farmers"}, {"item": "4. The EIL parameter according to all regions", "timeline": "48 weeks", "description": "4. The EIL parameter according to all regions"}]	[{"name": "Project Timeline", "duration": "48 weeks", "deliverables": []}]	41786160	\N	medium	[{"amount": 1920000, "category": "Project Management", "reasoning": "Dedicated project manager for planning, coordination, risk management, and client communication over 48 weeks."}, {"amount": 11600000, "category": "Research & Data Acquisition (EIL & Agricultural Data)", "reasoning": "Extensive research, data collection, and expert consultation required to define Economic Injury Levels (EIL) across diverse global regions and gather comprehensive crop disease datasets. This is a significant data science and domain expertise effort."}, {"amount": 1440000, "category": "UX/UI Design", "reasoning": "User experience research, wireframing, prototyping, and visual design for a farmer-specific mobile/web application, ensuring ease of use and accessibility."}, {"amount": 12252000, "category": "ML Model Development & Training", "reasoning": "Development, training, validation, and optimization of the ConvNeXT ML model for crop disease analysis, including significant compute resources for training."}, {"amount": 5760000, "category": "Application Development (Frontend & Backend)", "reasoning": "Building the farmer-facing application, including backend logic, API development, database integration, and frontend user interface implementation."}, {"amount": 1440000, "category": "Quality Assurance & Testing", "reasoning": "Comprehensive testing of the ML model for accuracy, the application for functionality, usability, performance, and security across various devices and scenarios."}, {"amount": 1000000, "category": "Deployment & Infrastructure", "reasoning": "Setting up cloud infrastructure, deploying the ML model and application, configuring monitoring, and ensuring scalability and reliability for global reach."}, {"amount": 6374160, "category": "Contingency", "reasoning": "Allocated for unforeseen challenges, scope changes, additional research, or technical complexities that may arise during the project lifecycle (approximately 18% of total project cost)."}]	The estimated budget reflects the significant complexity of developing a global-scale AI solution for crop disease analysis. Key cost drivers include: 1. The ambitious scope of defining 'EIL parameter according to all regions,' which necessitates extensive data collection, research, and domain expertise from agricultural specialists. 2. The development and training of a robust ConvNeXT ML model, requiring skilled ML engineers and substantial computational resources. 3. The global target audience ('farmers across globe') implies the need for scalable, robust infrastructure and careful consideration of regional variations in data and EIL parameters. 4. Dedicated UX design is crucial for ensuring the application's usability for a diverse farmer audience. The 48-week timeline is ambitious for the stated global scope, particularly for the EIL parameter definition. The estimate includes a substantial contingency to account for these inherent uncertainties and potential scope creep related to data acquisition and regional variations. The estimate aligns closely with the provided historical data point for a similar project title.	INR	4	48	\N	2025-11-10 21:51:52.055	2025-11-10 21:51:52.055
\.


--
-- TOC entry 4526 (class 0 OID 17591)
-- Dependencies: 331
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, name, email, phone, company, address, notes, budget, currency, status, created_by, created_at) FROM stdin;
cmhsmji5f000hil8zaow4uiru	TEST CLIENT	certainlymohneesh@gmail.com	+917498147939	TEST company	Flat no. 101, Rajat Enclave, Bhupesh Nagar\nBhupesh Nagar	Just him	300000000	INR	ACTIVE	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-10 04:10:24.255
\.


--
-- TOC entry 4545 (class 0 OID 18077)
-- Dependencies: 350
-- Data for Name: estimations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estimations (id, client_id, project_id, title, description, estimated_hours, estimated_cost, currency, confidence, rationale, suggested_packages, risk_factors, assumptions, similar_projects_count, historical_accuracy, ai_model, created_by, created_at, updated_at) FROM stdin;
cmhsu4dnv0003ilevnc8s2qo9	cmhsmji5f000hil8zaow4uiru	cmhsmktvz000jil8z7t6ndcfv	Booking APP	Booking app with proper concurrency	560	1400000	INR	0.75	The estimate provides for a robust booking system with proper concurrency and a functional website, representing an MVP. The client's budget of 10,000 INR is significantly insufficient for this scope, which typically requires 1.4M+ INR for a quality implementation, primarily due to the complexity of concurrency and the need for a comprehensive website. This estimate reflects a realistic cost for a production-ready solution.	[{"cost": 1400000, "name": "Core Concurrency Booking MVP", "hours": 560, "description": "Includes a robust backend with proper concurrency handling for a single resource type, basic user authentication, a functional booking website, and a simple admin panel. This is the minimum to meet core requirements."}, {"cost": 10000, "name": "Initial Consultation & Scoping Session", "hours": 4, "description": "A 4-hour session to discuss project goals, technical feasibility for concurrency within budget constraints, and outline potential phased approaches or alternative solutions. This is the only service that aligns with the stated budget."}]	[{"risk": "Concurrency Complexity", "impact": "high", "mitigation": "Thorough architectural design, stress testing, and use of proven transactional patterns."}, {"risk": "Undefined Booking Domain", "impact": "medium", "mitigation": "Detailed discovery phase to define specific booking rules, resource types, and user flows."}, {"risk": "Payment Gateway Integration", "impact": "medium", "mitigation": "Select a well-documented payment gateway early and allocate dedicated time for integration and compliance."}]	["Hourly rate of 2500 INR/hour for a blended team (developer, QA, PM).", "Booking system for a single, well-defined type of resource/service.", "Standard user authentication and authorization.", "Basic payment gateway integration (e.g., Razorpay/Stripe sandbox).", "No complex third-party integrations beyond payment."]	0	\N	gemini-2.5-flash	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-10 07:42:35.559	2025-11-10 07:42:35.559
cmhsudspd0005ilev916309px	cmhsmji5f000hil8zaow4uiru	cmhsmktvz000jil8z7t6ndcfv	Booking app 	Booking app with concurrency backend	560	1400000	INR	0.75	The estimate provides for a robust booking system with proper concurrency and a functional website, representing an MVP. The client's budget of 10,000 INR is significantly insufficient for this scope, which typically requires 1.4M+ INR for a quality implementation, primarily due to the complexity of concurrency and the need for a comprehensive website. This estimate reflects a realistic cost for a production-ready solution.	[{"cost": 1400000, "name": "Core Concurrency Booking MVP", "hours": 560, "description": "Includes a robust backend with proper concurrency handling for a single resource type, basic user authentication, a functional booking website, and a simple admin panel. This is the minimum to meet core requirements."}, {"cost": 10000, "name": "Initial Consultation & Scoping Session", "hours": 4, "description": "A 4-hour session to discuss project goals, technical feasibility for concurrency within budget constraints, and outline potential phased approaches or alternative solutions. This is the only service that aligns with the stated budget."}]	[{"risk": "Concurrency Complexity", "impact": "high", "mitigation": "Thorough architectural design, stress testing, and use of proven transactional patterns."}, {"risk": "Undefined Booking Domain", "impact": "medium", "mitigation": "Detailed discovery phase to define specific booking rules, resource types, and user flows."}, {"risk": "Payment Gateway Integration", "impact": "medium", "mitigation": "Select a well-documented payment gateway early and allocate dedicated time for integration and compliance."}]	["Hourly rate of 2500 INR/hour for a blended team (developer, QA, PM).", "Booking system for a single, well-defined type of resource/service.", "Standard user authentication and authorization.", "Basic payment gateway integration (e.g., Razorpay/Stripe sandbox).", "No complex third-party integrations beyond payment."]	1	\N	gemini-2.5-flash	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-10 07:49:54.961	2025-11-10 07:49:54.961
cmhsug1qe0007ilevekch4g7e	cmhsmji5f000hil8zaow4uiru	cmhsmktvz000jil8z7t6ndcfv	Booking app	Booking app with concurrency backend	560	1400000	INR	0.75	The estimate provides for a robust booking system with proper concurrency and a functional website, representing an MVP. The client's budget of 10,000 INR is significantly insufficient for this scope, which typically requires 1.4M+ INR for a quality implementation, primarily due to the complexity of concurrency and the need for a comprehensive website. This estimate reflects a realistic cost for a production-ready solution.	[{"cost": 1400000, "name": "Core Concurrency Booking MVP", "hours": 560, "description": "Includes a robust backend with proper concurrency handling for a single resource type, basic user authentication, a functional booking website, and a simple admin panel. This is the minimum to meet core requirements."}, {"cost": 10000, "name": "Initial Consultation & Scoping Session", "hours": 4, "description": "A 4-hour session to discuss project goals, technical feasibility for concurrency within budget constraints, and outline potential phased approaches or alternative solutions. This is the only service that aligns with the stated budget."}]	[{"risk": "Concurrency Complexity", "impact": "high", "mitigation": "Thorough architectural design, stress testing, and use of proven transactional patterns."}, {"risk": "Undefined Booking Domain", "impact": "medium", "mitigation": "Detailed discovery phase to define specific booking rules, resource types, and user flows."}, {"risk": "Payment Gateway Integration", "impact": "medium", "mitigation": "Select a well-documented payment gateway early and allocate dedicated time for integration and compliance."}]	["Hourly rate of 2500 INR/hour for a blended team (developer, QA, PM).", "Booking system for a single, well-defined type of resource/service.", "Standard user authentication and authorization.", "Basic payment gateway integration (e.g., Razorpay/Stripe sandbox).", "No complex third-party integrations beyond payment."]	2	\N	gemini-2.5-flash	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-10 07:51:39.974	2025-11-10 07:51:39.974
\.


--
-- TOC entry 4528 (class 0 OID 17615)
-- Dependencies: 333
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_items (id, invoice_id, description, quantity, rate, total, created_at) FROM stdin;
cmhtfrt960002ilgb9rlpev0s	cmhtfrt960001ilgblyt8quz5	Requirements Analysis & Scope Definition	1	2000	2000	2025-11-10 17:48:40.794
cmhtfrt960003ilgby4tool6y	cmhtfrt960001ilgblyt8quz5	Technical Feasibility Study & Architecture Outline	1	2000	2000	2025-11-10 17:48:40.794
cmhtfrt960004ilgbn8stod4r	cmhtfrt960001ilgblyt8quz5	Core Booking Flow Wireframes (UI/UX)	1	2000	2000	2025-11-10 17:48:40.794
cmhtfrt960005ilgbuucp7s73	cmhtfrt960001ilgblyt8quz5	Interactive Prototype (Basic Non-Concurrent Flow)	1	2000	2000	2025-11-10 17:48:40.794
cmhtfrt960006ilgbvd6l4gn5	cmhtfrt960001ilgblyt8quz5	Full Platform Roadmap & High-Level Cost Estimate	1	2000	2000	2025-11-10 17:48:40.794
cmhth62sv0002il4atjvt13kn	cmhth62sv0001il4a44ouu94k	Project Kick-off & Discovery	1	3571.29	3571.29	2025-11-10 18:27:45.967
cmhth62sv0003il4add0lxxx5	cmhth62sv0001il4a44ouu94k	Information Architecture (IA) & User Flows	1	3571.29	3571.29	2025-11-10 18:27:45.967
cmhth62sv0004il4a2rp6qg56	cmhth62sv0001il4a44ouu94k	Wireframing (Low-Fidelity Design)	1	3571.29	3571.29	2025-11-10 18:27:45.967
cmhth62sv0005il4au2nnwzah	cmhth62sv0001il4a44ouu94k	High-Fidelity UI Design Mockups	1	3571.29	3571.29	2025-11-10 18:27:45.967
cmhth62sv0006il4a0ik455c7	cmhth62sv0001il4a44ouu94k	Interactive Prototype with Transitions & Animations	1	3571.29	3571.29	2025-11-10 18:27:45.967
cmhth62sv0007il4abwc2s28b	cmhth62sv0001il4a44ouu94k	Basic Design System / Style Guide	1	3571.29	3571.29	2025-11-10 18:27:45.967
cmhth62sv0008il4a08d3qqwg	cmhth62sv0001il4a44ouu94k	Design Handoff & Asset Delivery	1	3571.29	3571.29	2025-11-10 18:27:45.967
cmhtjcb4a0004il011gwnuv86	cmhtjcb490003il01bel1ux6y	Project Kick-off & Discovery	1	8427.14	8427.14	2025-11-10 19:28:35.914
cmhtjcb4a0005il01bhvu8g1x	cmhtjcb490003il01bel1ux6y	Sanity.io CMS Setup & Schema Definition	1	8427.14	8427.14	2025-11-10 19:28:35.914
cmhtjcb4a0006il016gj83vcd	cmhtjcb490003il01bel1ux6y	Responsive Product Catalog & Detail Pages	1	8427.14	8427.14	2025-11-10 19:28:35.914
cmhtjcb4a0007il01uajqu2wu	cmhtjcb490003il01bel1ux6y	Shopping Cart & Basic Checkout Flow	1	8427.14	8427.14	2025-11-10 19:28:35.914
cmhtjcb4a0008il01cp1zokbx	cmhtjcb490003il01bel1ux6y	Resend Email Integration	1	8427.14	8427.14	2025-11-10 19:28:35.914
cmhtjcb4a0009il01hlks0w5x	cmhtjcb490003il01bel1ux6y	Mobile Responsiveness & UI Adjustments	1	8427.14	8427.14	2025-11-10 19:28:35.914
cmhtjcb4a000ail01cd1eggas	cmhtjcb490003il01bel1ux6y	Deployment & Basic Quality Assurance (QA)	1	8427.14	8427.14	2025-11-10 19:28:35.914
cmhui4ea7000gilstpxdh7gen	cmhui4ea6000filst54tdpzeg	ConvNeXt ML model	1	16000	16000	2025-11-11 11:42:13.326
cmhuj9zb0000lilstvrqtbdai	cmhuj9zb0000kilstlh1soa6c	ConvNeXT ML Model Development	1	6583333.33	6583333.33	2025-11-11 12:14:33.468
cmhuj9zb0000milstuozx1a1r	cmhuj9zb0000kilstlh1soa6c	Farmer-Centric Mobile Application (iOS/Android)	1	6583333.33	6583333.33	2025-11-11 12:14:33.468
cmhuj9zb0000nilst3y9fbs6r	cmhuj9zb0000kilstlh1soa6c	UX/UI Design for Farmers	1	6583333.33	6583333.33	2025-11-11 12:14:33.468
cmhuj9zb0000oilstbo5jnssa	cmhuj9zb0000kilstlh1soa6c	Regional EIL Parameter Integration	1	6583333.33	6583333.33	2025-11-11 12:14:33.468
cmhuj9zb0000pilstvubapx10	cmhuj9zb0000kilstlh1soa6c	Backend Infrastructure & API Development	1	6583333.33	6583333.33	2025-11-11 12:14:33.468
cmhuj9zb0000qilstdw1ioo5c	cmhuj9zb0000kilstlh1soa6c	Testing, Deployment & Training	1	6583333.33	6583333.33	2025-11-11 12:14:33.468
\.


--
-- TOC entry 4527 (class 0 OID 17600)
-- Dependencies: 332
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, "invoiceNumber", client_id, issued_by_id, due_date, issued_date, status, "paymentMethod", notes, tax_rate, discount, currency, pdf_url, is_recurring, recurrence, next_issue_date, last_sent_date, reminder_sent, created_at, updated_at, enable_payment_link, e_signature_url, watermark_text, razorpay_payment_link_id, razorpay_payment_link_url, razorpay_payment_link_status, razorpay_payment_id, razorpay_order_id, auto_generate_enabled, auto_send_enabled, max_occurrences, occurrence_count, parent_invoice_id, recipient_emails, send_day_of_period) FROM stdin;
cmhtfrt960001ilgblyt8quz5	INV-0001	cmhsmji5f000hil8zaow4uiru	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-12-10 17:48:40.792	2025-11-10 17:48:40.794	PENDING	\N	Converted from proposal: Booking Platform MVP - Discovery & Prototype Concept\n\n50% upfront to commence the project, 50% upon completion and final delivery of all agreed-upon deliverables for this phase.	0	0	INR	\N	f	\N	\N	\N	f	2025-11-10 17:48:40.794	2025-11-10 17:48:40.794	f	\N	\N	\N	\N	\N	\N	\N	t	f	\N	0	\N	{}	\N
cmhth62sv0001il4a44ouu94k	INV-0002	cmhsmji5f000hil8zaow4uiru	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-12-10 18:27:45.966	2025-11-10 18:27:45.967	PENDING	\N	Converted from proposal: Proposal for Brand Showcase Website UI/UX Design\n\nPayment Terms:\n50% (INR 12,499.50) upfront upon proposal acceptance. 25% (INR 6,249.75) upon completion of Milestone 2. 25% (INR 6,249.75) upon final design handoff (Milestone 4 completion).	0	0	INR	\N	f	\N	\N	\N	f	2025-11-10 18:27:45.967	2025-11-10 18:27:45.967	f	\N	\N	\N	\N	\N	\N	\N	t	f	\N	0	\N	{}	\N
cmhtjcb490003il01bel1ux6y	INV-0003	cmhsmji5f000hil8zaow4uiru	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-12-10 19:28:35.913	2025-11-10 19:28:35.914	PENDING	\N	Converted from proposal: Proposal for MachaCo E-commerce Apparel Platform (MVP)\n\nPayment Terms:\n50% upfront upon proposal acceptance, 25% at Milestone 2 completion, and the final 25% upon project completion and successful deployment (Milestone 4).	0	0	INR	https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/invoices/pdfs/invoice-INV-0003.pdf	f	\N	\N	\N	f	2025-11-10 19:28:35.914	2025-11-10 19:28:36.658	f	\N	\N	\N	\N	\N	\N	\N	t	f	\N	0	\N	{}	\N
cmhui4ea6000filst54tdpzeg	INV-2025-0004	cmhsmji5f000hil8zaow4uiru	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2026-01-10 11:42:13.325	2025-11-11 11:42:13.325	PENDING	\N	Good One	5	15	INR	\N	t	MONTHLY	2025-12-11 11:42:13.325	\N	f	2025-11-11 11:42:13.326	2025-11-11 11:42:13.326	f	\N	\N	\N	\N	\N	\N	\N	t	t	5	0	\N	{}	\N
cmhuj9zb0000kilstlh1soa6c	INV-2026	cmhsmji5f000hil8zaow4uiru	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-12-11 12:14:33.467	2025-11-11 12:14:33.468	PENDING	\N	Converted from proposal: Proposal for AI-Powered Crop Disease Detection & EIL Analysis System\n\nPayment Terms:\n25% upfront, 25% at Phase 2 completion, 25% at Phase 3 completion, 25% on final system deployment and acceptance.	0	0	INR	https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/invoices/pdfs/invoice-INV-2026.pdf	f	\N	\N	\N	f	2025-11-11 12:14:33.468	2025-11-11 12:14:34	f	\N	\N	\N	\N	\N	\N	\N	t	f	\N	0	\N	{}	\N
\.


--
-- TOC entry 4542 (class 0 OID 17741)
-- Dependencies: 347
-- Data for Name: issue_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.issue_comments (id, issue_id, user_id, content, created_at) FROM stdin;
\.


--
-- TOC entry 4541 (class 0 OID 17731)
-- Dependencies: 346
-- Data for Name: issues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.issues (id, title, description, status, priority, project_id, board_id, task_id, assigned_to, created_by, created_at, updated_at) FROM stdin;
cmhuiybuf000iilstzo3h3lyo	ConvNeXt ML model Wrong Accuracy	Getting Wrong accuracy of EIL value as it is differeing and have a wrong dataset	IN_PROGRESS	LOW	cmhsmktvz000jil8z7t6ndcfv	cmhsmmxgd000lil8zpyayl2vt	\N	5cccba40-2316-4748-a31b-95b77fbc67f2	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-11 12:05:29.846	2025-11-11 12:05:34.917
\.


--
-- TOC entry 4550 (class 0 OID 18259)
-- Dependencies: 355
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, activity_id, read_at, created_at) FROM stdin;
cmhudmz0a0001ilb1bgt9tpir	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	cmhsmgqpc000fil8zf79crzn3	2025-11-11 09:36:43.451	2025-11-11 09:36:41.914
cmhudn13e0005ilb1a2f824yt	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	cmhsmfnuq000bil8zom7v0iub	2025-11-11 09:36:44.617	2025-11-11 09:36:44.619
cmhudn2360007ilb1hxus02pb	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	cmhsmf4eq0007il8zutdm1z2z	2025-11-11 09:36:45.905	2025-11-11 09:36:45.906
cmhuh8c520003ilstcq3y9mbs	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	cmhuh7g1s0001ilstwy5ugz29	2025-11-11 11:17:22.4	2025-11-11 11:17:17.552
cmhujoz55000wilstuoub1byl	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	cmhujbrxn000uilst8endtaxs	2025-11-11 12:26:13.096	2025-11-11 12:26:13.097
cmhuw5zj9000hilb3j5680p4u	0874fd0a-2809-4832-bcca-0d6290003589	cmhsmf4eq0007il8zutdm1z2z	2025-11-11 18:15:22.148	2025-11-11 18:15:22.15
cmhuw5zkd000jilb39t3uvmjf	0874fd0a-2809-4832-bcca-0d6290003589	cmhsmfnuq000bil8zom7v0iub	2025-11-11 18:15:22.148	2025-11-11 18:15:22.15
cmhuw5zkj000milb3vvh9bhiu	0874fd0a-2809-4832-bcca-0d6290003589	cmhujbrxn000uilst8endtaxs	2025-11-11 18:15:22.148	2025-11-11 18:15:22.15
cmhuw5zkj000nilb3fscd16zm	0874fd0a-2809-4832-bcca-0d6290003589	cmhuw5l1w000filb3twk2edtg	2025-11-11 18:15:22.148	2025-11-11 18:15:22.158
cmhuw5zkm000pilb3db105l16	0874fd0a-2809-4832-bcca-0d6290003589	cmhuvyzoa0009ilb3cv0uricj	2025-11-11 18:15:22.148	2025-11-11 18:15:22.15
cmhuw5zkn000rilb34qxv94ew	0874fd0a-2809-4832-bcca-0d6290003589	cmhuvyie20003ilb3eh47jwws	2025-11-11 18:15:22.148	2025-11-11 18:15:22.15
cmhuw5zkn000tilb3wqgecpre	0874fd0a-2809-4832-bcca-0d6290003589	cmhuh7g1s0001ilstwy5ugz29	2025-11-11 18:15:22.148	2025-11-11 18:15:22.15
cmhuw5zkq000vilb3e1dcllyu	0874fd0a-2809-4832-bcca-0d6290003589	cmhsmgqpc000fil8zf79crzn3	2025-11-11 18:15:22.148	2025-11-11 18:15:22.15
cmhuw7pqz0011ilb3q77olv9x	dff17b82-13a7-4820-9632-db590622825f	cmhsmf4eq0007il8zutdm1z2z	2025-11-11 18:16:42.778	2025-11-11 18:16:42.779
cmhuw7pr30015ilb3j5gewu65	dff17b82-13a7-4820-9632-db590622825f	cmhuw5l1w000filb3twk2edtg	2025-11-11 18:16:42.778	2025-11-11 18:16:42.78
cmhuw7pr40017ilb3gus61gza	dff17b82-13a7-4820-9632-db590622825f	cmhujbrxn000uilst8endtaxs	2025-11-11 18:16:42.778	2025-11-11 18:16:42.779
cmhuw7pr30013ilb3w01ozktn	dff17b82-13a7-4820-9632-db590622825f	cmhuh7g1s0001ilstwy5ugz29	2025-11-11 18:16:42.778	2025-11-11 18:16:42.78
cmhuw7pr4001filb30ot4jpam	dff17b82-13a7-4820-9632-db590622825f	cmhuvyzoa0009ilb3cv0uricj	2025-11-11 18:16:42.778	2025-11-11 18:16:42.78
cmhuw7pr40019ilb3151kw8y9	dff17b82-13a7-4820-9632-db590622825f	cmhuvyie20003ilb3eh47jwws	2025-11-11 18:16:42.778	2025-11-11 18:16:42.78
cmhuw7pr4001cilb3gtohi60v	dff17b82-13a7-4820-9632-db590622825f	cmhsmgqpc000fil8zf79crzn3	2025-11-11 18:16:42.778	2025-11-11 18:16:42.779
cmhuw7pr4001dilb36tv74jhz	dff17b82-13a7-4820-9632-db590622825f	cmhsmfnuq000bil8zom7v0iub	2025-11-11 18:16:42.778	2025-11-11 18:16:42.779
cmhuw7psb001hilb38xh8rhwv	dff17b82-13a7-4820-9632-db590622825f	cmhuw7f79000zilb3drelfi13	2025-11-11 18:16:42.778	2025-11-11 18:16:42.78
\.


--
-- TOC entry 4551 (class 0 OID 20559)
-- Dependencies: 356
-- Data for Name: organisations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organisations (id, name, email, phone, budget, currency, status, type, notes, logo_url, website, address, city, state, country, pincode, owner_id, max_projects, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4543 (class 0 OID 17749)
-- Dependencies: 348
-- Data for Name: payment_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_settings (id, user_id, razorpay_account_id, account_status, account_holder_name, account_number, ifsc_code, bank_name, branch_name, account_type, pan_number, business_name, gst_number, contact_email, contact_phone, business_address, city, state, pincode, country, enable_commission, commission_percent, settlement_schedule, account_active, verification_notes, created_at, updated_at) FROM stdin;
cmhsnf28c0001ilvd2xuvoywi	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	\N	PENDING	Test User	000000000000	SBIN0000001	State Bank of India	Test Branch	SAVINGS	AAAPL1234C	Test Business Pvt Ltd	27AAAPL1234C1ZA	test@example.com	+919876543210	123 Test Street, Test Area	Mumbai	Maharashtra	400001	India	t	5	INSTANT	f	Razorpay API Error: Access Denied (BAD_REQUEST_ERROR)	2025-11-10 04:34:56.653	2025-11-10 04:34:56.653
\.


--
-- TOC entry 4540 (class 0 OID 17722)
-- Dependencies: 345
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, name, description, client_id, team_id, status, goal, created_at, updated_at, completed_tasks, end_date, organisation_id, start_date) FROM stdin;
cmhsmktvz000jil8z7t6ndcfv	TEST PROJECT	TEST DESCRIPTION	cmhsmji5f000hil8zaow4uiru	cmhsmf4dn0005il8zshfcubr1	ACTIVE	20	2025-11-10 04:11:26.16	2025-11-10 04:11:26.16	\N	\N	\N	\N
\.


--
-- TOC entry 4544 (class 0 OID 18065)
-- Dependencies: 349
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proposals (id, client_id, project_id, title, brief, deliverables, timeline, pricing, currency, payment_terms, status, is_change_order, parent_proposal_id, change_reason, pdf_url, e_signature_url, signed_at, signed_by_name, generated_by_ai, ai_prompt, ai_model, created_by, created_at, updated_at, accepted_at, expires_at, rejected_at, section_blocks, sent_at, sent_to, template_id, access_token, last_viewed_at, token_expires_at, view_count) FROM stdin;
cmhssxb9b0001ilevwi3lprvh	cmhsmji5f000hil8zaow4uiru	\N	Booking Platform MVP - Discovery & Prototype Concept	Booking platform	[{"item": "Requirements Analysis & Scope Definition", "timeline": "3-5 days", "description": "Conduct a detailed session to understand specific booking scenarios, user roles, core functionalities, and initial concurrency requirements. Deliver a 'Project Scope Document' outlining the agreed-upon features for the MVP and future phases."}, {"item": "Technical Feasibility Study & Architecture Outline", "timeline": "3-5 days", "description": "Research and propose a high-level technical architecture suitable for handling concurrent bookings, including technology stack recommendations and key considerations for scalability and data integrity. Deliver an 'Architectural Recommendation Brief'."}, {"item": "Core Booking Flow Wireframes (UI/UX)", "timeline": "4-6 days", "description": "Design low-fidelity wireframes for the critical user interfaces of the booking process, including availability display, selection, and reservation steps, focusing on clarity and user experience. Deliver 'Key Wireframe Designs'."}, {"item": "Interactive Prototype (Basic Non-Concurrent Flow)", "timeline": "5-7 days", "description": "Develop a basic, clickable front-end prototype demonstrating a simplified booking path without backend concurrency logic. This is for visual and user flow validation, not functional concurrency. Deliver a 'Clickable Prototype Link'."}, {"item": "Full Platform Roadmap & High-Level Cost Estimate", "timeline": "2-3 days", "description": "Based on the discovery phase, provide a phased roadmap for the full development of a robust concurrent booking platform, including estimated timelines and approximate cost ranges for each major phase. Deliver a 'Project Roadmap & Estimate Document'."}]	{"total": "2 Weeks (10 business days)", "milestones": [{"name": "Milestone 1: Discovery & Initial Design", "duration": "1 Week", "deliverables": ["Requirements Analysis & Scope Definition", "Technical Feasibility Study & Architecture Outline", "Core Booking Flow Wireframes (UI/UX)"]}, {"name": "Milestone 2: Prototype & Future Planning", "duration": "1 Week", "deliverables": ["Interactive Prototype (Basic Non-Concurrent Flow)", "Full Platform Roadmap & High-Level Cost Estimate"]}]}	10000	INR	50% upfront to commence the project, 50% upon completion and final delivery of all agreed-upon deliverables for this phase.	ACCEPTED	f	\N	\N	https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/proposals/pdfs/proposal-cmhssxb9b0001ilevwi3lprvh.pdf	\N	\N	\N	t	Booking platform	gemini-2.0-flash-exp	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-10 07:09:06.24	2025-11-10 17:23:30.834	2025-11-10 17:23:30.833	\N	\N	\N	2025-11-10 14:24:21.919	certainlymohneesh@gmail.com	\N	\N	\N	\N	0
cmhtha2d8000ail4aafipc4hg	cmhsmji5f000hil8zaow4uiru	\N	Proposal for MachaCo E-commerce Apparel Platform (MVP)	E-commerce Website Naming MachaCo a leading Apparel Brand	[{"item": "Project Kick-off & Discovery", "timeline": "1 week", "description": "Initial consultation to gather detailed requirements, define user stories, and outline the core functionalities of the e-commerce platform for MachaCo. This phase ensures alignment on project scope and objectives."}, {"item": "Sanity.io CMS Setup & Schema Definition", "timeline": "2 weeks", "description": "Configuration of the Sanity.io content management system. This includes defining custom schemas for 'Products' (with fields for Name, Description, Price, Images, Categories) and 'Categories' to enable efficient content management for apparel."}, {"item": "Responsive Product Catalog & Detail Pages", "timeline": "4 weeks", "description": "Development of a mobile-first, responsive frontend for displaying apparel products. This includes a Product Listing Page (PLP) with basic product cards and a Product Detail Page (PDP) showcasing product images, descriptions, pricing, and an 'Add to Cart' button."}, {"item": "Shopping Cart & Basic Checkout Flow", "timeline": "3 weeks", "description": "Implementation of a functional shopping cart where users can add, review, update quantities, and remove items. A streamlined, basic checkout process will be developed to capture essential customer and shipping information, integrating a placeholder for payment or a simple Cash on Delivery (COD) option."}, {"item": "Resend Email Integration", "timeline": "2 weeks", "description": "Setup and integration of Resend.com for handling essential transactional emails. This will include automated order confirmation emails to customers upon successful checkout."}, {"item": "Mobile Responsiveness & UI Adjustments", "timeline": "2 weeks", "description": "Thorough testing and refinement of the website's user interface to ensure optimal viewing and interaction across various mobile devices, tablets, and desktop screens, delivering a consistent user experience."}, {"item": "Deployment & Basic Quality Assurance (QA)", "timeline": "2 weeks", "description": "Deployment of the e-commerce platform to a production environment (e.g., Vercel for frontend, Sanity.io for backend). This includes basic functional testing and quality assurance to ensure core features are operational."}]	[{"name": "Design Phase", "duration": "4 days", "deliverables": ["UX", "Mobile Responsive UI"]}]	58990	INR	50% upfront upon proposal acceptance, 25% at Milestone 2 completion, and the final 25% upon project completion and successful deployment (Milestone 4).	ACCEPTED	f	\N	\N	https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/proposals/pdfs/proposal-cmhtha2d8000ail4aafipc4hg.pdf	data:image/png;base64,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	2025-11-10 19:27:40.792	Mohneesh Naidu	t	E-commerce Website Naming MachaCo a leading Apparel Brand	gemini-2.5-flash	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-10 18:30:52.028	2025-11-10 19:53:46.868	2025-11-10 19:27:40.792	2025-12-10 19:23:34.834	\N	\N	2025-11-10 19:23:34.835	certainlymohneesh@gmail.com	\N	gc3Xo5WtAIEGAiurP0fBwghppsfvNj8QAiv4HVlRoEor8nFlPyaRaPsBvVXwiTQG	2025-11-10 19:26:35.558	2025-11-10 19:27:40.792	3
cmhtg2ft10001il3oso2r14zx	cmhsmji5f000hil8zaow4uiru	\N	Proposal for Brand Showcase Website UI/UX Design	Just the design of a brand showcase website	[{"item": "Project Kick-off & Discovery", "timeline": "1 week", "description": "Initial meeting to understand brand identity, target audience, business goals, and gather content requirements. Includes competitive analysis and stakeholder interviews."}, {"item": "Information Architecture (IA) & User Flows", "timeline": "1 week", "description": "Development of a sitemap, user journey maps, and defined user flows to ensure intuitive navigation and optimal user experience."}, {"item": "Wireframing (Low-Fidelity Design)", "timeline": "1.5 weeks", "description": "Creation of grayscale wireframes for key pages to define layout, structure, and content hierarchy without visual distractions."}, {"item": "High-Fidelity UI Design Mockups", "timeline": "2 weeks", "description": "Development of visually stunning, pixel-perfect UI designs for all agreed-upon pages, incorporating brand guidelines, color palettes, typography, and imagery. Includes 2 rounds of revisions."}, {"item": "Interactive Prototype with Transitions & Animations", "timeline": "1 week", "description": "Creation of a clickable prototype showcasing the user interface, demonstrating specified transitions, micro-interactions, and animations to bring the design to life and simulate user experience."}, {"item": "Basic Design System / Style Guide", "timeline": "0.5 weeks", "description": "A concise document outlining key design elements like color palette, typography, iconography, and common UI components for consistency and future scalability."}, {"item": "Design Handoff & Asset Delivery", "timeline": "0.5 weeks", "description": "Organization and delivery of all final design files (e.g., Figma, Sketch) and assets (e.g., icons, images) in a developer-friendly format."}]	{"total": "7 weeks", "milestones": [{"name": "Milestone 1: Discovery & UX Foundation", "duration": "2 weeks", "deliverables": ["Project Kick-off & Discovery", "Information Architecture (IA) & User Flows"]}, {"name": "Milestone 2: Wireframing & Initial UI Concepts", "duration": "2 weeks", "deliverables": ["Wireframing (Low-Fidelity Design)", "High-Fidelity UI Design Mockups (initial concepts)"]}, {"name": "Milestone 3: Refinement & Prototyping", "duration": "2 weeks", "deliverables": ["High-Fidelity UI Design Mockups (revisions & final)", "Interactive Prototype with Transitions & Animations"]}, {"name": "Milestone 4: Finalization & Handoff", "duration": "1 week", "deliverables": ["Basic Design System / Style Guide", "Design Handoff & Asset Delivery"]}]}	24999	INR	50% (INR 12,499.50) upfront upon proposal acceptance. 25% (INR 6,249.75) upon completion of Milestone 2. 25% (INR 6,249.75) upon final design handoff (Milestone 4 completion).	CONVERTED_TO_INVOICE	f	\N	\N	https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/proposals/pdfs/proposal-cmhtg2ft10001il3oso2r14zx.pdf	\N	\N	\N	t	Just the design of a brand showcase website	gemini-2.5-flash	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-10 17:56:56.581	2025-11-10 19:38:35.063	2025-11-10 18:27:34.71	\N	\N	\N	2025-11-10 18:01:48.582	certainlymohneesh@gmail.com	\N	\N	\N	\N	0
cmhtoijxx0003iltyfh2a7qko	cmhsmji5f000hil8zaow4uiru	\N	Proposal for AI-Powered Crop Disease Detection & EIL Analysis System	Make a ConvNeXT ML model that analyses the crop disease and gives the EIL level for that region where the crop was located. The purpose of this model is to serve farmers across globe.\n	[{"item": "ConvNeXT ML Model Development", "timeline": "8-10 weeks", "description": "Design, train, and optimize a robust ConvNeXT machine learning model capable of accurately identifying various crop diseases from image inputs and predicting Economic Injury Levels (EIL)."}, {"item": "Farmer-Centric Mobile Application (iOS/Android)", "timeline": "12-14 weeks", "description": "Develop a user-friendly mobile application enabling farmers to upload crop images, receive instant disease diagnoses, view EIL levels, and access localized recommendations."}, {"item": "UX/UI Design for Farmers", "timeline": "6-8 weeks", "description": "Comprehensive user experience and interface design tailored for global farmers, ensuring intuitive navigation, clear visual feedback, and accessibility across diverse technical proficiencies."}, {"item": "Regional EIL Parameter Integration", "timeline": "10-12 weeks", "description": "Research, define, and integrate region-specific Economic Injury Level (EIL) parameters into the ML model and application for precise, localized risk assessment and guidance."}, {"item": "Backend Infrastructure & API Development", "timeline": "10-12 weeks", "description": "Build a scalable cloud-based backend to host the ML model, manage data, handle user requests, and provide secure API endpoints for the mobile application."}, {"item": "Testing, Deployment & Training", "timeline": "4-6 weeks", "description": "Rigorous testing (functional, performance, security), secure deployment to production environments, and provision of user training materials and ongoing support documentation."}]	{"total": "40-44 weeks", "milestones": [{"name": "Phase 1: Discovery, UX/UI & Data Strategy", "duration": "8 weeks", "deliverables": ["UX/UI Design for Farmers", "Initial Data Collection Strategy"]}, {"name": "Phase 2: ML Model & Core Backend Development", "duration": "12 weeks", "deliverables": ["ConvNeXT ML Model (initial version)", "Backend Infrastructure & API (core)"]}, {"name": "Phase 3: Mobile App & Regional EIL Integration", "duration": "12 weeks", "deliverables": ["Farmer-Centric Mobile Application (beta)", "Regional EIL Parameter Integration"]}, {"name": "Phase 4: System Integration, Testing & Deployment", "duration": "8-12 weeks", "deliverables": ["Fully Integrated System", "Comprehensive Testing", "Production Deployment", "Training & Documentation"]}]}	39500000	INR	25% upfront, 25% at Phase 2 completion, 25% at Phase 3 completion, 25% on final system deployment and acceptance.	CONVERTED_TO_INVOICE	f	\N	\N	https://scmyzihaokadwwszaimd.supabase.co/storage/v1/object/public/proposals/pdfs/proposal-cmhtoijxx0003iltyfh2a7qko.pdf	data:image/png;base64,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	2025-11-11 12:13:54.788	Mohneesh Naidu	t	Make a ConvNeXT ML model that analyses the crop disease and gives the EIL level for that region where the crop was located. The purpose of this model is to serve farmers across globe.\n	gemini-2.5-flash	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-10 21:53:25.366	2025-11-11 12:14:34.042	2025-11-11 12:13:54.788	2025-12-11 12:08:53.177	\N	\N	2025-11-11 12:08:53.177	certainlymohneesh@gmail.com	\N	7iQzNZuLP6y6IFEl1WW07fSSSMlG-l3j3CkTY-Sgx3A4fjT0YIwHP4sG2lcrHb1f	2025-11-11 12:13:26.139	2025-11-11 12:13:54.788	1
\.


--
-- TOC entry 4547 (class 0 OID 18097)
-- Dependencies: 352
-- Data for Name: scope_radar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scope_radar (id, project_id, creep_risk, revision_count, out_of_scope_count, flagged_items, patterns, recommendations, change_order_draft, estimated_impact, acknowledged, acknowledged_at, ai_model, flagged_at, updated_at, budget_overrun, budget_overrun_percent, client_email_draft, current_estimate, email_sent, email_sent_at, original_budget) FROM stdin;
\.


--
-- TOC entry 4548 (class 0 OID 18162)
-- Dependencies: 353
-- Data for Name: signatures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.signatures (id, proposal_id, signer_name, signer_email, signer_title, signature_blob, signature_type, signed_at, ip_address, user_agent) FROM stdin;
cmhtjb4je0001il01bauohbwj	cmhtha2d8000ail4aafipc4hg	Mohneesh Naidu	certainlymohneesh@gmail.com	CEO	data:image/png;base64,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	draw	2025-11-10 19:27:40.73	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
cmhuj95ex0001l204q16si34q	cmhtoijxx0003iltyfh2a7qko	Mohneesh Naidu	mohneeshnaidu@gmail.com	CEO	data:image/png;base64,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	draw	2025-11-11 12:13:54.729	183.87.195.147	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
\.


--
-- TOC entry 4525 (class 0 OID 17583)
-- Dependencies: 330
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, user_id, stripe_price_id, stripe_subscription_id, current_period_end, status, created_at) FROM stdin;
\.


--
-- TOC entry 4539 (class 0 OID 17714)
-- Dependencies: 344
-- Data for Name: task_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_activities (id, task_id, user_id, action, details, created_at) FROM stdin;
cmhsmnkt6000wil8zzylh5l4f	cmhsmnkrr000uil8zig2m3exv	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	TASK_CREATED	{"listName": "In Progress", "taskTitle": "just theman "}	2025-11-10 04:13:34.362
cmhsmnmsb000yil8zgkb8eurp	cmhsmnkrr000uil8zig2m3exv	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	TASK_MOVED	{"toList": "To Do", "fromList": "In Progress"}	2025-11-10 04:13:36.923
cmhsmo9op0010il8zi55lgshy	cmhsmnkrr000uil8zig2m3exv	5cccba40-2316-4748-a31b-95b77fbc67f2	TASK_MOVED	{"toList": "Done", "fromList": "To Do"}	2025-11-10 04:14:06.602
cmhsmpc0i0012il8zmugc68az	cmhsmnkrr000uil8zig2m3exv	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	TASK_MOVED	{"toList": "To Do", "fromList": "Done"}	2025-11-10 04:14:56.274
\.


--
-- TOC entry 4537 (class 0 OID 17698)
-- Dependencies: 342
-- Data for Name: task_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_attachments (id, task_id, file_name, file_url, file_size, mime_type, uploaded_by, created_at) FROM stdin;
\.


--
-- TOC entry 4536 (class 0 OID 17690)
-- Dependencies: 341
-- Data for Name: task_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_comments (id, task_id, user_id, content, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4535 (class 0 OID 17679)
-- Dependencies: 340
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, title, board_id, list_id, assigned_to, created_by, priority, status, "position", due_date, completed_at, estimated_hours, actual_hours, tags, created_at, updated_at, archived, description) FROM stdin;
cmhsmnkrr000uil8zig2m3exv	just theman 	cmhsmmxgd000lil8zpyayl2vt	cmhsmmxh5000mil8z8qcnbean	5cccba40-2316-4748-a31b-95b77fbc67f2	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	HIGH	TODO	0	2025-11-13 00:00:00	\N	\N	\N	{}	2025-11-10 04:13:34.311	2025-11-10 04:14:56.204	f	test task
\.


--
-- TOC entry 4531 (class 0 OID 17642)
-- Dependencies: 336
-- Data for Name: team_invites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_invites (id, team_id, email, role, token, invited_by, used_at, expires_at, created_at) FROM stdin;
cmhsmfnj70009il8zit5x68d6	cmhsmf4dn0005il8zshfcubr1	vaxis81719@fergetic.com	member	AMHyTplwp1xiJwLkpo8eBiIvc4QMtqwS	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-10 04:08:15.39	2025-11-17 04:07:24.642	2025-11-10 04:07:24.643
cmhuvyhz60001ilb3661pvdha	cmhsmf4dn0005il8zshfcubr1	2203chemicalmyth@gmail.com	member	7CSw-OnEd5lSDXVw7XwZuVm2RXee3neN	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-11 18:15:03.353	2025-11-18 18:09:32.801	2025-11-11 18:09:32.802
cmhuvyzew0007ilb3fnwg26hr	cmhsmf4dn0005il8zshfcubr1	mgnaidu_b22@tx.vjti.ac.in	member	xIldAV2XPDIqBVWX-Wwe_5rXujpBTudO	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-11 18:16:29.086	2025-11-18 18:09:55.4	2025-11-11 18:09:55.401
\.


--
-- TOC entry 4530 (class 0 OID 17632)
-- Dependencies: 335
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_members (id, team_id, user_id, role, added_by, accepted_at, created_at) FROM stdin;
cmhsmgqoc000dil8zl6bkbt48	cmhsmf4dn0005il8zshfcubr1	5cccba40-2316-4748-a31b-95b77fbc67f2	member	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-10 04:08:15.371	2025-11-10 04:08:15.372
cmhuw5l0h000dilb360ux2n2k	cmhsmf4dn0005il8zshfcubr1	0874fd0a-2809-4832-bcca-0d6290003589	member	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-11 18:15:03.328	2025-11-11 18:15:03.329
cmhuw7f5w000xilb3rbakq8p6	cmhsmf4dn0005il8zshfcubr1	dff17b82-13a7-4820-9632-db590622825f	member	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-11 18:16:29.059	2025-11-11 18:16:29.06
\.


--
-- TOC entry 4529 (class 0 OID 17624)
-- Dependencies: 334
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, name, description, created_by, created_at, updated_at) FROM stdin;
cmhsmc7990001il8zioqr0yv5	COOLED	YOUMAN	5cccba40-2316-4748-a31b-95b77fbc67f2	2025-11-10 04:04:43.581	2025-11-10 04:04:43.581
cmhsmf4dn0005il8zshfcubr1	google	Just him	36661deb-c5d1-4d65-a6a4-e4413b6e19fc	2025-11-10 04:06:59.82	2025-11-10 04:06:59.82
cmhuw4jt50001la04mynifdx0	Mohneesh “Chemical myth” Naidu's Team	Your personal workspace	0874fd0a-2809-4832-bcca-0d6290003589	2025-11-11 18:14:15.113	2025-11-11 18:14:15.113
\.


--
-- TOC entry 4546 (class 0 OID 18087)
-- Dependencies: 351
-- Data for Name: update_drafts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.update_drafts (id, week_start, client_id, project_id, summary, accomplishments, blockers, next_steps, metrics, status, sent_at, sent_to, generated_by_ai, ai_model, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4524 (class 0 OID 17575)
-- Dependencies: 329
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, display_name, avatar_url, created_at, updated_at, stripe_customer_id) FROM stdin;
5cccba40-2316-4748-a31b-95b77fbc67f2	vaxis81719@fergetic.com	TEST USER	\N	2025-11-10 04:03:36.117	2025-11-10 04:04:43.557	\N
36661deb-c5d1-4d65-a6a4-e4413b6e19fc	certainlymohneesh@gmail.com	Mohneesh Naidu	\N	2025-11-10 03:50:04.045	2025-11-10 04:06:59.798	\N
dff17b82-13a7-4820-9632-db590622825f	mgnaidu_b22@tx.vjti.ac.in	MG Naidu	\N	2025-11-11 15:28:29.951	2025-11-11 15:28:29.951	\N
0874fd0a-2809-4832-bcca-0d6290003589	2203chemicalmyth@gmail.com	Mohneesh “Chemical myth” Naidu	\N	2025-11-11 18:14:15.096	2025-11-11 18:14:15.096	\N
\.


--
-- TOC entry 4517 (class 0 OID 17112)
-- Dependencies: 318
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-11-08 14:56:08
20211116045059	2025-11-08 14:56:08
20211116050929	2025-11-08 14:56:09
20211116051442	2025-11-08 14:56:10
20211116212300	2025-11-08 14:56:10
20211116213355	2025-11-08 14:56:11
20211116213934	2025-11-08 14:56:12
20211116214523	2025-11-08 14:56:12
20211122062447	2025-11-08 14:56:13
20211124070109	2025-11-08 14:56:14
20211202204204	2025-11-08 14:56:14
20211202204605	2025-11-08 14:56:15
20211210212804	2025-11-08 14:56:17
20211228014915	2025-11-08 14:56:18
20220107221237	2025-11-08 14:56:18
20220228202821	2025-11-08 14:56:19
20220312004840	2025-11-08 14:56:19
20220603231003	2025-11-08 14:56:20
20220603232444	2025-11-08 14:56:21
20220615214548	2025-11-08 14:56:22
20220712093339	2025-11-08 14:56:22
20220908172859	2025-11-08 14:56:23
20220916233421	2025-11-08 14:56:24
20230119133233	2025-11-08 14:56:24
20230128025114	2025-11-08 14:56:25
20230128025212	2025-11-08 14:56:26
20230227211149	2025-11-08 14:56:26
20230228184745	2025-11-08 14:56:27
20230308225145	2025-11-08 14:56:27
20230328144023	2025-11-08 14:56:28
20231018144023	2025-11-08 14:56:29
20231204144023	2025-11-08 14:56:30
20231204144024	2025-11-08 14:56:30
20231204144025	2025-11-08 14:56:31
20240108234812	2025-11-08 14:56:32
20240109165339	2025-11-08 14:56:32
20240227174441	2025-11-08 14:56:33
20240311171622	2025-11-08 14:56:34
20240321100241	2025-11-08 14:56:36
20240401105812	2025-11-08 14:56:37
20240418121054	2025-11-08 14:56:38
20240523004032	2025-11-08 14:56:40
20240618124746	2025-11-08 14:56:41
20240801235015	2025-11-08 14:56:42
20240805133720	2025-11-08 14:56:42
20240827160934	2025-11-08 14:56:43
20240919163303	2025-11-08 14:56:44
20240919163305	2025-11-08 14:56:44
20241019105805	2025-11-08 14:56:45
20241030150047	2025-11-08 14:56:47
20241108114728	2025-11-08 14:56:48
20241121104152	2025-11-08 14:56:49
20241130184212	2025-11-08 14:56:50
20241220035512	2025-11-08 14:56:50
20241220123912	2025-11-08 14:56:51
20241224161212	2025-11-08 14:56:51
20250107150512	2025-11-08 14:56:52
20250110162412	2025-11-08 14:56:53
20250123174212	2025-11-08 14:56:53
20250128220012	2025-11-08 14:56:54
20250506224012	2025-11-08 14:56:54
20250523164012	2025-11-08 14:56:55
20250714121412	2025-11-08 14:56:56
20250905041441	2025-11-08 14:56:56
20251103001201	2025-11-11 21:25:12
\.


--
-- TOC entry 4522 (class 0 OID 17247)
-- Dependencies: 324
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- TOC entry 4500 (class 0 OID 16546)
-- Dependencies: 298
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
invoices	invoices	\N	2025-11-10 14:02:40.722017+00	2025-11-10 14:02:40.722017+00	t	f	10485760	{application/pdf,text/html}	\N	STANDARD
proposals	proposals	\N	2025-11-10 14:02:40.722017+00	2025-11-10 14:02:40.722017+00	t	f	10485760	{application/pdf}	\N	STANDARD
\.


--
-- TOC entry 4523 (class 0 OID 17276)
-- Dependencies: 325
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (id, type, format, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4502 (class 0 OID 16588)
-- Dependencies: 300
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-11-08 14:56:07.556626
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-11-08 14:56:07.565358
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-11-08 14:56:07.572441
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-11-08 14:56:07.599426
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-11-08 14:56:07.647126
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-11-08 14:56:07.652129
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-11-08 14:56:07.660304
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-11-08 14:56:07.665192
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-11-08 14:56:07.669542
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-11-08 14:56:07.675224
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-11-08 14:56:07.681219
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-11-08 14:56:07.686926
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-11-08 14:56:07.694653
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-11-08 14:56:07.699142
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-11-08 14:56:07.70381
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-11-08 14:56:07.731456
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-11-08 14:56:07.735926
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-11-08 14:56:07.74047
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-11-08 14:56:07.745219
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-11-08 14:56:07.752685
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-11-08 14:56:07.757258
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-11-08 14:56:07.764915
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-11-08 14:56:07.781804
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-11-08 14:56:07.7937
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-11-08 14:56:07.79912
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-11-08 14:56:07.803528
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2025-11-08 14:56:07.811807
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2025-11-08 14:56:07.826192
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2025-11-08 14:56:08.533613
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2025-11-08 14:56:08.541362
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2025-11-08 14:56:08.548596
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2025-11-08 14:56:08.66545
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2025-11-08 14:56:08.672948
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2025-11-08 14:56:08.680947
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2025-11-08 14:56:08.684023
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2025-11-08 14:56:08.692875
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2025-11-08 14:56:08.697248
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-11-08 14:56:08.703672
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2025-11-08 14:56:08.709084
39	add-search-v2-sort-support	39cf7d1e6bf515f4b02e41237aba845a7b492853	2025-11-08 14:56:08.718055
40	fix-prefix-race-conditions-optimized	fd02297e1c67df25a9fc110bf8c8a9af7fb06d1f	2025-11-08 14:56:08.723255
41	add-object-level-update-trigger	44c22478bf01744b2129efc480cd2edc9a7d60e9	2025-11-08 14:56:08.733481
42	rollback-prefix-triggers	f2ab4f526ab7f979541082992593938c05ee4b47	2025-11-08 14:56:08.738923
43	fix-object-level	ab837ad8f1c7d00cc0b7310e989a23388ff29fc6	2025-11-08 14:56:08.745079
\.


--
-- TOC entry 4501 (class 0 OID 16561)
-- Dependencies: 299
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, level) FROM stdin;
6f1cc6d4-26ec-4b01-b8f9-a76db32be3b7	proposals	pdfs/proposal-cmhssxb9b0001ilevwi3lprvh.pdf	\N	2025-11-10 14:24:21.815673+00	2025-11-10 14:24:21.815673+00	2025-11-10 14:24:21.815673+00	{"eTag": "\\"51086cccf239391a28eed0a8b546e004\\"", "size": 6119, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2025-11-10T14:24:22.000Z", "contentLength": 6119, "httpStatusCode": 200}	bf9e348c-1156-4d44-9571-07f4388ab655	\N	{}	2
213ea76a-3af1-4fb6-934f-2c8323c8b904	proposals	pdfs/proposal-cmhtg2ft10001il3oso2r14zx.pdf	\N	2025-11-10 18:01:48.532838+00	2025-11-10 18:01:48.532838+00	2025-11-10 18:01:48.532838+00	{"eTag": "\\"b5c01c0651175126a88fe35a35b8b432\\"", "size": 6107, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2025-11-10T18:01:49.000Z", "contentLength": 6107, "httpStatusCode": 200}	4c07c0a2-dc3c-4b3d-883b-324eb2113777	\N	{}	2
91b405e8-384f-40a9-8ee7-3556fddb30c0	proposals	pdfs/proposal-cmhtha2d8000ail4aafipc4hg.pdf	\N	2025-11-10 19:02:37.188536+00	2025-11-10 19:23:34.785746+00	2025-11-10 19:02:37.188536+00	{"eTag": "\\"3b5af85a6118bf34b30d8dddb043cb0d\\"", "size": 11827, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2025-11-10T19:23:35.000Z", "contentLength": 11827, "httpStatusCode": 200}	5bd07bb3-ddb2-4ac6-b6b9-117dc1ebe146	\N	{}	2
9a7aea00-91d2-4906-9e40-c6ce9d25c150	invoices	pdfs/invoice-INV-0003.pdf	\N	2025-11-10 19:28:36.514738+00	2025-11-10 19:28:36.514738+00	2025-11-10 19:28:36.514738+00	{"eTag": "\\"bc6f40f688bb5244687aee7c74f6dc50\\"", "size": 6075, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2025-11-10T19:28:37.000Z", "contentLength": 6075, "httpStatusCode": 200}	578efb9e-e340-4aa1-8767-84392c7bea25	\N	{}	2
c4a05632-2dab-4cc2-a358-938410349625	invoices	pdfs/invoice-INV-0004.pdf	\N	2025-11-10 19:38:34.941786+00	2025-11-10 19:38:34.941786+00	2025-11-10 19:38:34.941786+00	{"eTag": "\\"5a1941579687d813e0f1127772d5db2b\\"", "size": 6040, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2025-11-10T19:38:35.000Z", "contentLength": 6040, "httpStatusCode": 200}	edec1ac7-8652-414f-90f1-d2a116979005	\N	{}	2
579e4811-85d4-4263-8301-15e34168ce2b	proposals	pdfs/proposal-cmhtoijxx0003iltyfh2a7qko.pdf	\N	2025-11-11 12:08:53.107405+00	2025-11-11 12:08:53.107405+00	2025-11-11 12:08:53.107405+00	{"eTag": "\\"45b3f169d77869ab97ed4b0d563ebc90\\"", "size": 9617, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2025-11-11T12:08:54.000Z", "contentLength": 9617, "httpStatusCode": 200}	2721afd3-ac58-4f4e-ab37-334779b213ef	\N	{}	2
ff0971c6-de0d-4a25-b4bb-1daef3c8cf68	invoices	pdfs/invoice-INV-2026.pdf	\N	2025-11-11 12:14:33.955763+00	2025-11-11 12:14:33.955763+00	2025-11-11 12:14:33.955763+00	{"eTag": "\\"fedf87615ce4d30cc1a7956a86006ac0\\"", "size": 5878, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2025-11-11T12:14:34.000Z", "contentLength": 5878, "httpStatusCode": 200}	fdc01340-539f-412d-a47c-889cdbd9f719	\N	{}	2
\.


--
-- TOC entry 4520 (class 0 OID 17202)
-- Dependencies: 321
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.prefixes (bucket_id, name, created_at, updated_at) FROM stdin;
proposals	pdfs	2025-11-10 14:24:21.815673+00	2025-11-10 14:24:21.815673+00
invoices	pdfs	2025-11-10 19:28:36.514738+00	2025-11-10 19:28:36.514738+00
\.


--
-- TOC entry 4518 (class 0 OID 17149)
-- Dependencies: 319
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- TOC entry 4519 (class 0 OID 17163)
-- Dependencies: 320
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- TOC entry 3765 (class 0 OID 16658)
-- Dependencies: 301
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4594 (class 0 OID 0)
-- Dependencies: 293
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 68, true);


--
-- TOC entry 4595 (class 0 OID 0)
-- Dependencies: 323
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- TOC entry 3996 (class 2606 OID 16829)
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- TOC entry 3950 (class 2606 OID 16531)
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 4019 (class 2606 OID 16935)
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- TOC entry 3974 (class 2606 OID 16953)
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- TOC entry 3976 (class 2606 OID 16963)
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- TOC entry 3948 (class 2606 OID 16524)
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- TOC entry 3998 (class 2606 OID 16822)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- TOC entry 3994 (class 2606 OID 16810)
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 3986 (class 2606 OID 17003)
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- TOC entry 3988 (class 2606 OID 16797)
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- TOC entry 4032 (class 2606 OID 17062)
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- TOC entry 4034 (class 2606 OID 17060)
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- TOC entry 4036 (class 2606 OID 17058)
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- TOC entry 4029 (class 2606 OID 17022)
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- TOC entry 4040 (class 2606 OID 17084)
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- TOC entry 4042 (class 2606 OID 17086)
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- TOC entry 4023 (class 2606 OID 16988)
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3942 (class 2606 OID 16514)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3945 (class 2606 OID 16740)
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- TOC entry 4008 (class 2606 OID 16869)
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- TOC entry 4010 (class 2606 OID 16867)
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4015 (class 2606 OID 16883)
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- TOC entry 3953 (class 2606 OID 16537)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 3981 (class 2606 OID 16761)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4005 (class 2606 OID 16850)
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- TOC entry 4000 (class 2606 OID 16841)
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 3935 (class 2606 OID 16923)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 3937 (class 2606 OID 16501)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4110 (class 2606 OID 17658)
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- TOC entry 4137 (class 2606 OID 17713)
-- Name: board_activities board_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_activities
    ADD CONSTRAINT board_activities_pkey PRIMARY KEY (id);


--
-- TOC entry 4120 (class 2606 OID 17678)
-- Name: board_lists board_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_lists
    ADD CONSTRAINT board_lists_pkey PRIMARY KEY (id);


--
-- TOC entry 4115 (class 2606 OID 17669)
-- Name: boards boards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_pkey PRIMARY KEY (id);


--
-- TOC entry 4196 (class 2606 OID 18238)
-- Name: budget_estimations budget_estimations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_estimations
    ADD CONSTRAINT budget_estimations_pkey PRIMARY KEY (id);


--
-- TOC entry 4073 (class 2606 OID 17599)
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- TOC entry 4174 (class 2606 OID 18086)
-- Name: estimations estimations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estimations
    ADD CONSTRAINT estimations_pkey PRIMARY KEY (id);


--
-- TOC entry 4091 (class 2606 OID 17623)
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4088 (class 2606 OID 17614)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 4158 (class 2606 OID 17748)
-- Name: issue_comments issue_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_comments
    ADD CONSTRAINT issue_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4156 (class 2606 OID 17740)
-- Name: issues issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_pkey PRIMARY KEY (id);


--
-- TOC entry 4201 (class 2606 OID 18266)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4211 (class 2606 OID 20571)
-- Name: organisations organisations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_pkey PRIMARY KEY (id);


--
-- TOC entry 4163 (class 2606 OID 17762)
-- Name: payment_settings payment_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT payment_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4147 (class 2606 OID 17730)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 4172 (class 2606 OID 18076)
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- TOC entry 4190 (class 2606 OID 18107)
-- Name: scope_radar scope_radar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scope_radar
    ADD CONSTRAINT scope_radar_pkey PRIMARY KEY (id);


--
-- TOC entry 4194 (class 2606 OID 18170)
-- Name: signatures signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_pkey PRIMARY KEY (id);


--
-- TOC entry 4070 (class 2606 OID 17590)
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 4139 (class 2606 OID 17721)
-- Name: task_activities task_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activities
    ADD CONSTRAINT task_activities_pkey PRIMARY KEY (id);


--
-- TOC entry 4135 (class 2606 OID 17705)
-- Name: task_attachments task_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 4133 (class 2606 OID 17697)
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4131 (class 2606 OID 17689)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 4106 (class 2606 OID 17650)
-- Name: team_invites team_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invites
    ADD CONSTRAINT team_invites_pkey PRIMARY KEY (id);


--
-- TOC entry 4100 (class 2606 OID 17641)
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4095 (class 2606 OID 17631)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 4183 (class 2606 OID 18096)
-- Name: update_drafts update_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.update_drafts
    ADD CONSTRAINT update_drafts_pkey PRIMARY KEY (id);


--
-- TOC entry 4067 (class 2606 OID 17582)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4062 (class 2606 OID 17447)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4056 (class 2606 OID 17255)
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- TOC entry 4045 (class 2606 OID 17116)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4059 (class 2606 OID 17286)
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 3956 (class 2606 OID 16554)
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- TOC entry 3966 (class 2606 OID 16595)
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- TOC entry 3968 (class 2606 OID 16593)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3964 (class 2606 OID 16571)
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- TOC entry 4053 (class 2606 OID 17211)
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- TOC entry 4050 (class 2606 OID 17172)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- TOC entry 4048 (class 2606 OID 17157)
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- TOC entry 3951 (class 1259 OID 16532)
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- TOC entry 3925 (class 1259 OID 16750)
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3926 (class 1259 OID 16752)
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3927 (class 1259 OID 16753)
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3984 (class 1259 OID 16831)
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- TOC entry 4017 (class 1259 OID 16939)
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- TOC entry 3972 (class 1259 OID 16919)
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- TOC entry 4596 (class 0 OID 0)
-- Dependencies: 3972
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- TOC entry 3977 (class 1259 OID 16747)
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- TOC entry 4020 (class 1259 OID 16936)
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- TOC entry 4021 (class 1259 OID 16937)
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- TOC entry 3992 (class 1259 OID 16942)
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- TOC entry 3989 (class 1259 OID 16803)
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- TOC entry 3990 (class 1259 OID 16948)
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- TOC entry 4030 (class 1259 OID 17073)
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- TOC entry 4027 (class 1259 OID 17026)
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- TOC entry 4037 (class 1259 OID 17099)
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4038 (class 1259 OID 17097)
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4043 (class 1259 OID 17098)
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- TOC entry 4024 (class 1259 OID 16995)
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- TOC entry 4025 (class 1259 OID 16994)
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- TOC entry 4026 (class 1259 OID 16996)
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- TOC entry 3928 (class 1259 OID 16754)
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3929 (class 1259 OID 16751)
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3938 (class 1259 OID 16515)
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- TOC entry 3939 (class 1259 OID 16516)
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- TOC entry 3940 (class 1259 OID 16746)
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- TOC entry 3943 (class 1259 OID 16833)
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- TOC entry 3946 (class 1259 OID 16938)
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- TOC entry 4011 (class 1259 OID 16875)
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- TOC entry 4012 (class 1259 OID 16940)
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- TOC entry 4013 (class 1259 OID 16890)
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- TOC entry 4016 (class 1259 OID 16889)
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- TOC entry 3978 (class 1259 OID 16941)
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- TOC entry 3979 (class 1259 OID 17111)
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- TOC entry 3982 (class 1259 OID 16832)
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- TOC entry 4003 (class 1259 OID 16857)
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- TOC entry 4006 (class 1259 OID 16856)
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- TOC entry 4001 (class 1259 OID 16842)
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- TOC entry 4002 (class 1259 OID 17004)
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- TOC entry 3991 (class 1259 OID 17001)
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- TOC entry 3983 (class 1259 OID 16830)
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- TOC entry 3930 (class 1259 OID 16910)
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- TOC entry 4597 (class 0 OID 0)
-- Dependencies: 3930
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- TOC entry 3931 (class 1259 OID 16748)
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- TOC entry 3932 (class 1259 OID 16505)
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- TOC entry 3933 (class 1259 OID 16965)
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- TOC entry 4111 (class 1259 OID 17791)
-- Name: idx_activities_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_created_at ON public.activities USING btree (created_at DESC);


--
-- TOC entry 4112 (class 1259 OID 17792)
-- Name: idx_activities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_user_id ON public.activities USING btree (user_id);


--
-- TOC entry 4113 (class 1259 OID 17793)
-- Name: idx_activities_user_recent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_user_recent ON public.activities USING btree (user_id, created_at DESC);


--
-- TOC entry 4121 (class 1259 OID 17797)
-- Name: idx_board_lists_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_board_lists_board_id ON public.board_lists USING btree (board_id);


--
-- TOC entry 4122 (class 1259 OID 17798)
-- Name: idx_board_lists_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_board_lists_position ON public.board_lists USING btree (board_id, "position");


--
-- TOC entry 4116 (class 1259 OID 17794)
-- Name: idx_boards_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boards_project_id ON public.boards USING btree (project_id);


--
-- TOC entry 4117 (class 1259 OID 17795)
-- Name: idx_boards_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boards_team_id ON public.boards USING btree (team_id);


--
-- TOC entry 4118 (class 1259 OID 17796)
-- Name: idx_boards_team_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boards_team_position ON public.boards USING btree (team_id, "position");


--
-- TOC entry 4197 (class 1259 OID 18241)
-- Name: idx_budget_estimations_accuracy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_estimations_accuracy ON public.budget_estimations USING btree (accuracy);


--
-- TOC entry 4198 (class 1259 OID 18240)
-- Name: idx_budget_estimations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_estimations_created_at ON public.budget_estimations USING btree (created_at DESC);


--
-- TOC entry 4199 (class 1259 OID 18239)
-- Name: idx_budget_estimations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budget_estimations_user_id ON public.budget_estimations USING btree (user_id);


--
-- TOC entry 4074 (class 1259 OID 17768)
-- Name: idx_clients_created_at_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_created_at_desc ON public.clients USING btree (created_at DESC);


--
-- TOC entry 4075 (class 1259 OID 17769)
-- Name: idx_clients_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_created_by ON public.clients USING btree (created_by);


--
-- TOC entry 4175 (class 1259 OID 18112)
-- Name: idx_estimations_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estimations_client_id ON public.estimations USING btree (client_id);


--
-- TOC entry 4176 (class 1259 OID 18114)
-- Name: idx_estimations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estimations_created_at ON public.estimations USING btree (created_at DESC);


--
-- TOC entry 4177 (class 1259 OID 18113)
-- Name: idx_estimations_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estimations_project_id ON public.estimations USING btree (project_id);


--
-- TOC entry 4089 (class 1259 OID 17779)
-- Name: idx_invoice_items_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items USING btree (invoice_id);


--
-- TOC entry 4076 (class 1259 OID 17771)
-- Name: idx_invoices_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_client_id ON public.invoices USING btree (client_id);


--
-- TOC entry 4077 (class 1259 OID 17772)
-- Name: idx_invoices_client_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_client_status ON public.invoices USING btree (client_id, status, due_date);


--
-- TOC entry 4078 (class 1259 OID 17773)
-- Name: idx_invoices_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_due_date ON public.invoices USING btree (due_date);


--
-- TOC entry 4079 (class 1259 OID 17774)
-- Name: idx_invoices_issued_by_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_issued_by_id ON public.invoices USING btree (issued_by_id);


--
-- TOC entry 4080 (class 1259 OID 17775)
-- Name: idx_invoices_issued_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_issued_date ON public.invoices USING btree (issued_date);


--
-- TOC entry 4081 (class 1259 OID 18251)
-- Name: idx_invoices_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_parent_id ON public.invoices USING btree (parent_invoice_id);


--
-- TOC entry 4082 (class 1259 OID 17778)
-- Name: idx_invoices_razorpay_link_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_razorpay_link_id ON public.invoices USING btree (razorpay_payment_link_id);


--
-- TOC entry 4083 (class 1259 OID 18250)
-- Name: idx_invoices_recurring_next; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_recurring_next ON public.invoices USING btree (is_recurring, next_issue_date);


--
-- TOC entry 4084 (class 1259 OID 17776)
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- TOC entry 4085 (class 1259 OID 17777)
-- Name: idx_invoices_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_user_status ON public.invoices USING btree (issued_by_id, status, issued_date DESC);


--
-- TOC entry 4148 (class 1259 OID 17810)
-- Name: idx_issues_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issues_assigned_to ON public.issues USING btree (assigned_to);


--
-- TOC entry 4149 (class 1259 OID 17811)
-- Name: idx_issues_assignee_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issues_assignee_status ON public.issues USING btree (assigned_to, status, priority);


--
-- TOC entry 4150 (class 1259 OID 17812)
-- Name: idx_issues_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issues_board_id ON public.issues USING btree (board_id);


--
-- TOC entry 4151 (class 1259 OID 17813)
-- Name: idx_issues_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issues_created_by ON public.issues USING btree (created_by);


--
-- TOC entry 4152 (class 1259 OID 17814)
-- Name: idx_issues_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issues_priority ON public.issues USING btree (priority);


--
-- TOC entry 4153 (class 1259 OID 17815)
-- Name: idx_issues_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issues_project_id ON public.issues USING btree (project_id);


--
-- TOC entry 4154 (class 1259 OID 17816)
-- Name: idx_issues_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issues_status ON public.issues USING btree (status);


--
-- TOC entry 4205 (class 1259 OID 20576)
-- Name: idx_organisations_created_at_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organisations_created_at_desc ON public.organisations USING btree (created_at DESC);


--
-- TOC entry 4206 (class 1259 OID 20572)
-- Name: idx_organisations_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organisations_owner_id ON public.organisations USING btree (owner_id);


--
-- TOC entry 4207 (class 1259 OID 20575)
-- Name: idx_organisations_owner_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organisations_owner_type ON public.organisations USING btree (owner_id, type);


--
-- TOC entry 4208 (class 1259 OID 20574)
-- Name: idx_organisations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organisations_status ON public.organisations USING btree (status);


--
-- TOC entry 4209 (class 1259 OID 20573)
-- Name: idx_organisations_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organisations_type ON public.organisations USING btree (type);


--
-- TOC entry 4159 (class 1259 OID 17820)
-- Name: idx_payment_settings_razorpay_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_settings_razorpay_account ON public.payment_settings USING btree (razorpay_account_id);


--
-- TOC entry 4160 (class 1259 OID 17821)
-- Name: idx_payment_settings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_settings_status ON public.payment_settings USING btree (account_status);


--
-- TOC entry 4161 (class 1259 OID 17819)
-- Name: idx_payment_settings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_settings_user_id ON public.payment_settings USING btree (user_id);


--
-- TOC entry 4140 (class 1259 OID 17806)
-- Name: idx_projects_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_client_id ON public.projects USING btree (client_id);


--
-- TOC entry 4141 (class 1259 OID 20578)
-- Name: idx_projects_org_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_org_status ON public.projects USING btree (organisation_id, status);


--
-- TOC entry 4142 (class 1259 OID 20577)
-- Name: idx_projects_organisation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_organisation_id ON public.projects USING btree (organisation_id);


--
-- TOC entry 4143 (class 1259 OID 17807)
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- TOC entry 4144 (class 1259 OID 17808)
-- Name: idx_projects_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_team_id ON public.projects USING btree (team_id);


--
-- TOC entry 4145 (class 1259 OID 17809)
-- Name: idx_projects_team_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_team_status ON public.projects USING btree (team_id, status, created_at DESC);


--
-- TOC entry 4166 (class 1259 OID 18108)
-- Name: idx_proposals_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_client_id ON public.proposals USING btree (client_id);


--
-- TOC entry 4167 (class 1259 OID 18111)
-- Name: idx_proposals_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_created_at ON public.proposals USING btree (created_at DESC);


--
-- TOC entry 4168 (class 1259 OID 18109)
-- Name: idx_proposals_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_project_id ON public.proposals USING btree (project_id);


--
-- TOC entry 4169 (class 1259 OID 18110)
-- Name: idx_proposals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_status ON public.proposals USING btree (status);


--
-- TOC entry 4184 (class 1259 OID 18252)
-- Name: idx_scope_radar_budget_overrun; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scope_radar_budget_overrun ON public.scope_radar USING btree (budget_overrun);


--
-- TOC entry 4185 (class 1259 OID 18253)
-- Name: idx_scope_radar_email_sent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scope_radar_email_sent ON public.scope_radar USING btree (email_sent);


--
-- TOC entry 4186 (class 1259 OID 18121)
-- Name: idx_scope_radar_flagged_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scope_radar_flagged_at ON public.scope_radar USING btree (flagged_at DESC);


--
-- TOC entry 4187 (class 1259 OID 18119)
-- Name: idx_scope_radar_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scope_radar_project_id ON public.scope_radar USING btree (project_id);


--
-- TOC entry 4188 (class 1259 OID 18120)
-- Name: idx_scope_radar_risk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scope_radar_risk ON public.scope_radar USING btree (creep_risk);


--
-- TOC entry 4191 (class 1259 OID 18171)
-- Name: idx_signatures_proposal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signatures_proposal_id ON public.signatures USING btree (proposal_id);


--
-- TOC entry 4192 (class 1259 OID 18172)
-- Name: idx_signatures_signed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_signatures_signed_at ON public.signatures USING btree (signed_at DESC);


--
-- TOC entry 4123 (class 1259 OID 17799)
-- Name: idx_tasks_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_assigned_to ON public.tasks USING btree (assigned_to);


--
-- TOC entry 4124 (class 1259 OID 17800)
-- Name: idx_tasks_assignee_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_assignee_status ON public.tasks USING btree (assigned_to, status, due_date);


--
-- TOC entry 4125 (class 1259 OID 17801)
-- Name: idx_tasks_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_board_id ON public.tasks USING btree (board_id);


--
-- TOC entry 4126 (class 1259 OID 17802)
-- Name: idx_tasks_board_list_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_board_list_position ON public.tasks USING btree (board_id, list_id, "position");


--
-- TOC entry 4127 (class 1259 OID 17803)
-- Name: idx_tasks_list_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_list_id ON public.tasks USING btree (list_id);


--
-- TOC entry 4128 (class 1259 OID 17804)
-- Name: idx_tasks_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_priority ON public.tasks USING btree (priority);


--
-- TOC entry 4129 (class 1259 OID 17805)
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- TOC entry 4102 (class 1259 OID 17787)
-- Name: idx_team_invites_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_invites_email ON public.team_invites USING btree (email);


--
-- TOC entry 4103 (class 1259 OID 17788)
-- Name: idx_team_invites_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_invites_team_id ON public.team_invites USING btree (team_id);


--
-- TOC entry 4104 (class 1259 OID 17789)
-- Name: idx_team_invites_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_invites_token ON public.team_invites USING btree (token);


--
-- TOC entry 4096 (class 1259 OID 17782)
-- Name: idx_team_members_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_role ON public.team_members USING btree (team_id, role);


--
-- TOC entry 4097 (class 1259 OID 17783)
-- Name: idx_team_members_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_team_id ON public.team_members USING btree (team_id);


--
-- TOC entry 4098 (class 1259 OID 17784)
-- Name: idx_team_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_user_id ON public.team_members USING btree (user_id);


--
-- TOC entry 4092 (class 1259 OID 17780)
-- Name: idx_teams_created_at_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_created_at_desc ON public.teams USING btree (created_at DESC);


--
-- TOC entry 4093 (class 1259 OID 17781)
-- Name: idx_teams_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_created_by ON public.teams USING btree (created_by);


--
-- TOC entry 4178 (class 1259 OID 18115)
-- Name: idx_updates_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_updates_client_id ON public.update_drafts USING btree (client_id);


--
-- TOC entry 4179 (class 1259 OID 18116)
-- Name: idx_updates_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_updates_project_id ON public.update_drafts USING btree (project_id);


--
-- TOC entry 4180 (class 1259 OID 18118)
-- Name: idx_updates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_updates_status ON public.update_drafts USING btree (status);


--
-- TOC entry 4181 (class 1259 OID 18117)
-- Name: idx_updates_week_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_updates_week_start ON public.update_drafts USING btree (week_start);


--
-- TOC entry 4063 (class 1259 OID 17765)
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_created_at_desc ON public.users USING btree (created_at DESC);


--
-- TOC entry 4064 (class 1259 OID 17766)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4086 (class 1259 OID 17770)
-- Name: invoices_invoiceNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON public.invoices USING btree ("invoiceNumber");


--
-- TOC entry 4202 (class 1259 OID 18269)
-- Name: notifications_user_id_activity_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX notifications_user_id_activity_id_key ON public.notifications USING btree (user_id, activity_id);


--
-- TOC entry 4203 (class 1259 OID 18268)
-- Name: notifications_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id_created_at_idx ON public.notifications USING btree (user_id, created_at DESC);


--
-- TOC entry 4204 (class 1259 OID 18267)
-- Name: notifications_user_id_read_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id_read_at_idx ON public.notifications USING btree (user_id, read_at);


--
-- TOC entry 4164 (class 1259 OID 17818)
-- Name: payment_settings_razorpay_account_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payment_settings_razorpay_account_id_key ON public.payment_settings USING btree (razorpay_account_id);


--
-- TOC entry 4165 (class 1259 OID 17817)
-- Name: payment_settings_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payment_settings_user_id_key ON public.payment_settings USING btree (user_id);


--
-- TOC entry 4170 (class 1259 OID 18216)
-- Name: proposals_access_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX proposals_access_token_key ON public.proposals USING btree (access_token);


--
-- TOC entry 4071 (class 1259 OID 17767)
-- Name: subscriptions_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX subscriptions_user_id_key ON public.subscriptions USING btree (user_id);


--
-- TOC entry 4107 (class 1259 OID 17790)
-- Name: team_invites_team_id_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_invites_team_id_email_key ON public.team_invites USING btree (team_id, email);


--
-- TOC entry 4108 (class 1259 OID 17786)
-- Name: team_invites_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_invites_token_key ON public.team_invites USING btree (token);


--
-- TOC entry 4101 (class 1259 OID 17785)
-- Name: team_members_team_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_members_team_id_user_id_key ON public.team_members USING btree (team_id, user_id);


--
-- TOC entry 4065 (class 1259 OID 17763)
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- TOC entry 4068 (class 1259 OID 17764)
-- Name: users_stripe_customer_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_stripe_customer_id_key ON public.users USING btree (stripe_customer_id);


--
-- TOC entry 4054 (class 1259 OID 17448)
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- TOC entry 4060 (class 1259 OID 17449)
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4057 (class 1259 OID 17346)
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- TOC entry 3954 (class 1259 OID 16560)
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- TOC entry 3957 (class 1259 OID 16582)
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- TOC entry 4046 (class 1259 OID 17183)
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- TOC entry 3958 (class 1259 OID 17229)
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- TOC entry 3959 (class 1259 OID 17148)
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- TOC entry 3960 (class 1259 OID 17260)
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- TOC entry 4051 (class 1259 OID 17261)
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- TOC entry 3961 (class 1259 OID 16583)
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- TOC entry 3962 (class 1259 OID 17259)
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- TOC entry 4289 (class 2620 OID 17302)
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- TOC entry 4282 (class 2620 OID 17268)
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- TOC entry 4283 (class 2620 OID 17299)
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- TOC entry 4284 (class 2620 OID 17225)
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- TOC entry 4285 (class 2620 OID 17298)
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- TOC entry 4287 (class 2620 OID 17264)
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- TOC entry 4288 (class 2620 OID 17300)
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- TOC entry 4286 (class 2620 OID 17136)
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- TOC entry 4214 (class 2606 OID 16734)
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4219 (class 2606 OID 16823)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4218 (class 2606 OID 16811)
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- TOC entry 4217 (class 2606 OID 16798)
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4225 (class 2606 OID 17063)
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4226 (class 2606 OID 17068)
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4227 (class 2606 OID 17092)
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4228 (class 2606 OID 17087)
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4224 (class 2606 OID 16989)
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4212 (class 2606 OID 16767)
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4221 (class 2606 OID 16870)
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4222 (class 2606 OID 16943)
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- TOC entry 4223 (class 2606 OID 16884)
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4215 (class 2606 OID 17106)
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4216 (class 2606 OID 16762)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4220 (class 2606 OID 16851)
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4243 (class 2606 OID 17872)
-- Name: activities activities_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4244 (class 2606 OID 17877)
-- Name: activities activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4256 (class 2606 OID 17937)
-- Name: board_activities board_activities_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_activities
    ADD CONSTRAINT board_activities_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4257 (class 2606 OID 17942)
-- Name: board_activities board_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_activities
    ADD CONSTRAINT board_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4247 (class 2606 OID 17892)
-- Name: board_lists board_lists_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_lists
    ADD CONSTRAINT board_lists_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4245 (class 2606 OID 17882)
-- Name: boards boards_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4246 (class 2606 OID 17887)
-- Name: boards boards_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4234 (class 2606 OID 17827)
-- Name: clients clients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4273 (class 2606 OID 18132)
-- Name: estimations estimations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estimations
    ADD CONSTRAINT estimations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4274 (class 2606 OID 18137)
-- Name: estimations estimations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estimations
    ADD CONSTRAINT estimations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4237 (class 2606 OID 17842)
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4235 (class 2606 OID 17832)
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4236 (class 2606 OID 17837)
-- Name: invoices invoices_issued_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_issued_by_id_fkey FOREIGN KEY (issued_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4268 (class 2606 OID 17992)
-- Name: issue_comments issue_comments_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_comments
    ADD CONSTRAINT issue_comments_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4269 (class 2606 OID 17997)
-- Name: issue_comments issue_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_comments
    ADD CONSTRAINT issue_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4263 (class 2606 OID 17967)
-- Name: issues issues_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4264 (class 2606 OID 17972)
-- Name: issues issues_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4265 (class 2606 OID 17977)
-- Name: issues issues_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4266 (class 2606 OID 17982)
-- Name: issues issues_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4267 (class 2606 OID 17987)
-- Name: issues issues_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4279 (class 2606 OID 18270)
-- Name: notifications notifications_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4280 (class 2606 OID 18275)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4281 (class 2606 OID 20579)
-- Name: organisations organisations_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4270 (class 2606 OID 18002)
-- Name: payment_settings payment_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT payment_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4260 (class 2606 OID 17957)
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4261 (class 2606 OID 20584)
-- Name: projects projects_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4262 (class 2606 OID 17962)
-- Name: projects projects_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4271 (class 2606 OID 18122)
-- Name: proposals proposals_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4272 (class 2606 OID 18127)
-- Name: proposals proposals_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4277 (class 2606 OID 18152)
-- Name: scope_radar scope_radar_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scope_radar
    ADD CONSTRAINT scope_radar_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4278 (class 2606 OID 18173)
-- Name: signatures signatures_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4233 (class 2606 OID 17822)
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4258 (class 2606 OID 17947)
-- Name: task_activities task_activities_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activities
    ADD CONSTRAINT task_activities_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4259 (class 2606 OID 17952)
-- Name: task_activities task_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_activities
    ADD CONSTRAINT task_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4254 (class 2606 OID 17927)
-- Name: task_attachments task_attachments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4255 (class 2606 OID 17932)
-- Name: task_attachments task_attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4252 (class 2606 OID 17917)
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4253 (class 2606 OID 17922)
-- Name: task_comments task_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4248 (class 2606 OID 17897)
-- Name: tasks tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4249 (class 2606 OID 17902)
-- Name: tasks tasks_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4250 (class 2606 OID 17907)
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4251 (class 2606 OID 17912)
-- Name: tasks tasks_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.board_lists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4241 (class 2606 OID 17862)
-- Name: team_invites team_invites_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invites
    ADD CONSTRAINT team_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4242 (class 2606 OID 17867)
-- Name: team_invites team_invites_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invites
    ADD CONSTRAINT team_invites_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4239 (class 2606 OID 17852)
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4240 (class 2606 OID 17857)
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4238 (class 2606 OID 17847)
-- Name: teams teams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4275 (class 2606 OID 18142)
-- Name: update_drafts update_drafts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.update_drafts
    ADD CONSTRAINT update_drafts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4276 (class 2606 OID 18147)
-- Name: update_drafts update_drafts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.update_drafts
    ADD CONSTRAINT update_drafts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4213 (class 2606 OID 16572)
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4232 (class 2606 OID 17212)
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4229 (class 2606 OID 17158)
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4230 (class 2606 OID 17178)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4231 (class 2606 OID 17173)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- TOC entry 4441 (class 0 OID 16525)
-- Dependencies: 296
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4455 (class 0 OID 16929)
-- Dependencies: 313
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4446 (class 0 OID 16727)
-- Dependencies: 304
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4440 (class 0 OID 16518)
-- Dependencies: 295
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4450 (class 0 OID 16816)
-- Dependencies: 308
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4449 (class 0 OID 16804)
-- Dependencies: 307
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4448 (class 0 OID 16791)
-- Dependencies: 306
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4456 (class 0 OID 16979)
-- Dependencies: 314
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4439 (class 0 OID 16507)
-- Dependencies: 294
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4453 (class 0 OID 16858)
-- Dependencies: 311
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4454 (class 0 OID 16876)
-- Dependencies: 312
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4442 (class 0 OID 16533)
-- Dependencies: 297
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4447 (class 0 OID 16757)
-- Dependencies: 305
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4452 (class 0 OID 16843)
-- Dependencies: 310
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4451 (class 0 OID 16834)
-- Dependencies: 309
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4438 (class 0 OID 16495)
-- Dependencies: 292
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4470 (class 0 OID 17651)
-- Dependencies: 337
-- Name: activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4476 (class 0 OID 17706)
-- Dependencies: 343
-- Name: board_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.board_activities ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4472 (class 0 OID 17670)
-- Dependencies: 339
-- Name: board_lists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.board_lists ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4471 (class 0 OID 17659)
-- Dependencies: 338
-- Name: boards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4464 (class 0 OID 17591)
-- Dependencies: 331
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4483 (class 0 OID 18077)
-- Dependencies: 350
-- Name: estimations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.estimations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4466 (class 0 OID 17615)
-- Dependencies: 333
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4465 (class 0 OID 17600)
-- Dependencies: 332
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4480 (class 0 OID 17741)
-- Dependencies: 347
-- Name: issue_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4479 (class 0 OID 17731)
-- Dependencies: 346
-- Name: issues; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4481 (class 0 OID 17749)
-- Dependencies: 348
-- Name: payment_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4478 (class 0 OID 17722)
-- Dependencies: 345
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4482 (class 0 OID 18065)
-- Dependencies: 349
-- Name: proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4485 (class 0 OID 18097)
-- Dependencies: 352
-- Name: scope_radar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scope_radar ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4486 (class 0 OID 18162)
-- Dependencies: 353
-- Name: signatures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4463 (class 0 OID 17583)
-- Dependencies: 330
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4477 (class 0 OID 17714)
-- Dependencies: 344
-- Name: task_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4475 (class 0 OID 17698)
-- Dependencies: 342
-- Name: task_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4474 (class 0 OID 17690)
-- Dependencies: 341
-- Name: task_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4473 (class 0 OID 17679)
-- Dependencies: 340
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4469 (class 0 OID 17642)
-- Dependencies: 336
-- Name: team_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4468 (class 0 OID 17632)
-- Dependencies: 335
-- Name: team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4467 (class 0 OID 17624)
-- Dependencies: 334
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4484 (class 0 OID 18087)
-- Dependencies: 351
-- Name: update_drafts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.update_drafts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4462 (class 0 OID 17575)
-- Dependencies: 329
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4461 (class 0 OID 17433)
-- Dependencies: 328
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4490 (class 3256 OID 18186)
-- Name: objects Authenticated Update for Invoices; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated Update for Invoices" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'invoices'::text));


--
-- TOC entry 4487 (class 3256 OID 18189)
-- Name: objects Authenticated Update for Proposals; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated Update for Proposals" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'proposals'::text));


--
-- TOC entry 4491 (class 3256 OID 18185)
-- Name: objects Authenticated Upload for Invoices; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated Upload for Invoices" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'invoices'::text));


--
-- TOC entry 4488 (class 3256 OID 18188)
-- Name: objects Authenticated Upload for Proposals; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated Upload for Proposals" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'proposals'::text));


--
-- TOC entry 4492 (class 3256 OID 18184)
-- Name: objects Public Read Access for Invoices; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Public Read Access for Invoices" ON storage.objects FOR SELECT USING ((bucket_id = 'invoices'::text));


--
-- TOC entry 4489 (class 3256 OID 18187)
-- Name: objects Public Read Access for Proposals; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Public Read Access for Proposals" ON storage.objects FOR SELECT USING ((bucket_id = 'proposals'::text));


--
-- TOC entry 4443 (class 0 OID 16546)
-- Dependencies: 298
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4460 (class 0 OID 17276)
-- Dependencies: 325
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4445 (class 0 OID 16588)
-- Dependencies: 300
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4444 (class 0 OID 16561)
-- Dependencies: 299
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4459 (class 0 OID 17202)
-- Dependencies: 321
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4457 (class 0 OID 17149)
-- Dependencies: 319
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4458 (class 0 OID 17163)
-- Dependencies: 320
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4493 (class 6104 OID 16426)
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- TOC entry 3758 (class 3466 OID 16621)
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- TOC entry 3763 (class 3466 OID 16700)
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- TOC entry 3757 (class 3466 OID 16619)
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- TOC entry 3764 (class 3466 OID 16703)
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- TOC entry 3759 (class 3466 OID 16622)
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- TOC entry 3760 (class 3466 OID 16623)
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


-- Completed on 2025-11-12 23:05:11 IST

--
-- PostgreSQL database dump complete
--

