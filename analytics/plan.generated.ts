// ────────────────────────────────────────────────────────
// AUTO-GENERATED from schema/tracking-plan.json
// Do not edit by hand. Run: npm run analytics:generate
// ────────────────────────────────────────────────────────

export const SCHEMA_VERSION = "9.4" as const;

/** All active event names (client + server). */
export type EventName =
  | "page_view"
  | "navigation_click"
  | "search"
  | "view_search_results"
  | "select_content"
  | "role_select"
  | "sign_up_start"
  | "sign_up"
  | "email_verify"
  | "verification_email_resend"
  | "login"
  | "logout"
  | "auth_error"
  | "password_reset_request"
  | "invitation_view"
  | "invitation_accept"
  | "invitation_decline"
  | "post_invite_class_select"
  | "share"
  | "generate_lead"
  | "sign_up_prompt_click"
  | "limit_hit"
  | "upgrade_cta_click"
  | "content_block"
  | "exception"
  | "web_vitals"
  | "scroll_milestone"
  | "test_generate"
  | "test_start"
  | "test_resume"
  | "test_restart"
  | "question_answer"
  | "test_module_start"
  | "test_pause"
  | "test_complete"
  | "test_tool_use"
  | "question_mark_for_review"
  | "test_results_view"
  | "review_question_open"
  | "mistake_dismiss"
  | "study_plan_cta_click"
  | "vocab_session_start"
  | "vocab_session_end"
  | "score_calculator_use"
  | "goal_set"
  | "exam_category_select"
  | "study_plan_wizard_step"
  | "study_plan_generate"
  | "study_plan_generate_error"
  | "study_plan_open"
  | "study_session_start_click"
  | "study_plan_delete"
  | "task_create"
  | "task_status_change"
  | "subtask_complete"
  | "subtask_link_click"
  | "task_delete"
  | "progress_report_view"
  | "assignment_open"
  | "hub_card_click"
  | "home_cta_click"
  | "view_promotion"
  | "select_promotion"
  | "promotion_dismiss"
  | "ai_request"
  | "ai_output_copy"
  | "ai_history_open"
  | "view_item_list"
  | "select_item"
  | "view_item"
  | "catalog_filter_apply"
  | "video_start"
  | "video_progress"
  | "video_complete"
  | "tutorial_question_answer"
  | "tutorial_category_complete"
  | "course_lesson_complete"
  | "course_complete"
  | "course_review_submit"
  | "live_session_join"
  | "class_material_open"
  | "event_attend_toggle"
  | "content_favorite"
  | "event_invite_send"
  | "content_view"
  | "outbound_link_click"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "checkout_session_error"
  | "checkout_return"
  | "purchase"
  | "refund"
  | "course_enroll"
  | "coupon_apply"
  | "subscription_change"
  | "donation_open"
  | "student_work_view"
  | "student_plan_edit"
  | "test_assign"
  | "invitation_send"
  | "invitation_cancel"
  | "tutor_email_send"
  | "email_unsubscribe"
  | "content_create"
  | "content_update"
  | "content_publish"
  | "content_delete"
  | "class_material_add"
  | "session_note_create"
  | "session_note_share"
  | "availability_update"
  | "verification_call_book_click"
  | "tutor_insights_view"
  | "session_booking_open"
  | "session_slot_select"
  | "post_create"
  | "post_react"
  | "post_share"
  | "poll_vote"
  | "comment_post"
  | "comment_upvote"
  | "space_follow"
  | "conversation_start"
  | "message_send"
  | "notifications_dropdown_open"
  | "notification_open"
  | "notification_pref_change"
  | "support_chat_open"
  | "support_message_send"
  | "faq_open"
  | "feedback_submit"
  | "profile_update"
  | "connection_request_send"
  | "connection_respond"
  | "connection_remove"
  ;

/** Client-only event names (pushed via track()). */
export type ClientEventName =
  | "page_view"
  | "navigation_click"
  | "search"
  | "view_search_results"
  | "select_content"
  | "role_select"
  | "sign_up_start"
  | "sign_up"
  | "email_verify"
  | "verification_email_resend"
  | "login"
  | "logout"
  | "auth_error"
  | "password_reset_request"
  | "invitation_view"
  | "invitation_accept"
  | "invitation_decline"
  | "post_invite_class_select"
  | "share"
  | "generate_lead"
  | "sign_up_prompt_click"
  | "limit_hit"
  | "upgrade_cta_click"
  | "content_block"
  | "exception"
  | "web_vitals"
  | "scroll_milestone"
  | "test_generate"
  | "test_start"
  | "test_resume"
  | "test_restart"
  | "question_answer"
  | "test_module_start"
  | "test_pause"
  | "test_complete"
  | "test_tool_use"
  | "question_mark_for_review"
  | "test_results_view"
  | "review_question_open"
  | "mistake_dismiss"
  | "study_plan_cta_click"
  | "vocab_session_start"
  | "vocab_session_end"
  | "score_calculator_use"
  | "goal_set"
  | "exam_category_select"
  | "study_plan_wizard_step"
  | "study_plan_generate"
  | "study_plan_generate_error"
  | "study_plan_open"
  | "study_session_start_click"
  | "study_plan_delete"
  | "task_create"
  | "task_status_change"
  | "subtask_complete"
  | "subtask_link_click"
  | "task_delete"
  | "progress_report_view"
  | "assignment_open"
  | "hub_card_click"
  | "home_cta_click"
  | "view_promotion"
  | "select_promotion"
  | "promotion_dismiss"
  | "ai_request"
  | "ai_output_copy"
  | "ai_history_open"
  | "view_item_list"
  | "select_item"
  | "view_item"
  | "catalog_filter_apply"
  | "video_start"
  | "video_progress"
  | "video_complete"
  | "tutorial_question_answer"
  | "tutorial_category_complete"
  | "course_lesson_complete"
  | "course_complete"
  | "course_review_submit"
  | "live_session_join"
  | "class_material_open"
  | "event_attend_toggle"
  | "content_favorite"
  | "event_invite_send"
  | "content_view"
  | "outbound_link_click"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "checkout_session_error"
  | "checkout_return"
  | "course_enroll"
  | "coupon_apply"
  | "subscription_change"
  | "donation_open"
  | "student_work_view"
  | "student_plan_edit"
  | "test_assign"
  | "invitation_send"
  | "invitation_cancel"
  | "tutor_email_send"
  | "email_unsubscribe"
  | "content_create"
  | "content_update"
  | "content_publish"
  | "content_delete"
  | "class_material_add"
  | "session_note_create"
  | "session_note_share"
  | "availability_update"
  | "verification_call_book_click"
  | "tutor_insights_view"
  | "session_booking_open"
  | "session_slot_select"
  | "post_create"
  | "post_react"
  | "post_share"
  | "poll_vote"
  | "comment_post"
  | "comment_upvote"
  | "space_follow"
  | "conversation_start"
  | "message_send"
  | "notifications_dropdown_open"
  | "notification_open"
  | "notification_pref_change"
  | "support_chat_open"
  | "support_message_send"
  | "faq_open"
  | "feedback_submit"
  | "profile_update"
  | "connection_request_send"
  | "connection_respond"
  | "connection_remove"
  ;

/** Deprecated event names — rejected by guards. */
export const DEPRECATED_EVENTS: readonly string[] = ["event_comment_post","ai_tutor_conversation_start","ai_tutor_conversation_open","ai_tutor_conversation_delete","ai_tutor_open"] as const;

/** Server-only events — rejected by track(). */
export const SERVER_ONLY_EVENTS: readonly string[] = ["purchase","refund"] as const;

export interface EventMeta {
  readonly name: string;
  readonly phase: number;
  readonly tier: string;
  readonly parameters: readonly string[];
  readonly server_only?: true;
  readonly suppress_in_tutor_mode?: true;
}

/** Metadata for every active event, keyed by name. */
export const EVENT_META: Record<EventName, EventMeta> = {
  "page_view": {"name":"page_view","phase":1,"tier":"page","parameters":["is_public_view"]},
  "navigation_click": {"name":"navigation_click","phase":1,"tier":"interaction","parameters":["nav_item_id","nav_section_id","destination_template"]},
  "search": {"name":"search","phase":1,"tier":"interaction","parameters":["search_term","search_origin"]},
  "view_search_results": {"name":"view_search_results","phase":1,"tier":"page","parameters":["search_term","results_count"]},
  "select_content": {"name":"select_content","phase":1,"tier":"interaction","parameters":["content_type","content_id","list_position","test_type","list_name"]},
  "role_select": {"name":"role_select","phase":1,"tier":"interaction","parameters":["selected_role","has_referral","has_invitation"]},
  "sign_up_start": {"name":"sign_up_start","phase":1,"tier":"interaction","parameters":["method"]},
  "sign_up": {"name":"sign_up","phase":1,"tier":"outcome","parameters":["method","signup_source","inviter_role","requires_verification"]},
  "email_verify": {"name":"email_verify","phase":1,"tier":"outcome","parameters":["verification_mode"]},
  "verification_email_resend": {"name":"verification_email_resend","phase":1,"tier":"interaction","parameters":[]},
  "login": {"name":"login","phase":1,"tier":"outcome","parameters":["method"]},
  "logout": {"name":"logout","phase":1,"tier":"interaction","parameters":[]},
  "auth_error": {"name":"auth_error","phase":1,"tier":"system","parameters":["auth_stage","method","error_code"]},
  "password_reset_request": {"name":"password_reset_request","phase":1,"tier":"interaction","parameters":[]},
  "invitation_view": {"name":"invitation_view","phase":1,"tier":"page","parameters":["inviter_role","invitation_valid"]},
  "invitation_accept": {"name":"invitation_accept","phase":1,"tier":"outcome","parameters":["inviter_role","existing_account"]},
  "invitation_decline": {"name":"invitation_decline","phase":1,"tier":"interaction","parameters":["inviter_role"]},
  "post_invite_class_select": {"name":"post_invite_class_select","phase":1,"tier":"interaction","parameters":["class_plan_id","skipped"]},
  "share": {"name":"share","phase":1,"tier":"outcome","parameters":["method","content_type"]},
  "generate_lead": {"name":"generate_lead","phase":1,"tier":"outcome","parameters":["lead_type","test_id"]},
  "sign_up_prompt_click": {"name":"sign_up_prompt_click","phase":1,"tier":"interaction","parameters":["cta_type"]},
  "limit_hit": {"name":"limit_hit","phase":1,"tier":"system","parameters":["limit_type","feature_type","gated_action","endpoint_template"]},
  "upgrade_cta_click": {"name":"upgrade_cta_click","phase":1,"tier":"interaction","parameters":["limit_type","cta_destination"]},
  "content_block": {"name":"content_block","phase":1,"tier":"system","parameters":["endpoint_template"]},
  "exception": {"name":"exception","phase":1,"tier":"system","parameters":["description","fatal","http_status","endpoint_template"]},
  "web_vitals": {"name":"web_vitals","phase":1,"tier":"system","parameters":["metric_name","metric_value","metric_rating"]},
  "scroll_milestone": {"name":"scroll_milestone","phase":1,"tier":"interaction","parameters":["scroll_percent"]},
  "test_generate": {"name":"test_generate","phase":2,"tier":"outcome","parameters":["test_id","test_type","creation_method","question_count","difficulty","only_new_questions","category_id"]},
  "test_start": {"name":"test_start","phase":2,"tier":"outcome","parameters":["test_id","test_type","exam_category","total_questions","section_count"],"suppress_in_tutor_mode":true},
  "test_resume": {"name":"test_resume","phase":2,"tier":"interaction","parameters":["test_id","test_type","answered_count","total_questions"],"suppress_in_tutor_mode":true},
  "test_restart": {"name":"test_restart","phase":2,"tier":"interaction","parameters":["test_id","test_type","restart_source"],"suppress_in_tutor_mode":true},
  "question_answer": {"name":"question_answer","phase":2,"tier":"interaction","parameters":["test_id","test_type","section_number","question_number","duration_sec","answer_changed","answer_format"],"suppress_in_tutor_mode":true},
  "test_module_start": {"name":"test_module_start","phase":2,"tier":"interaction","parameters":["test_id","test_type","module_number","section_number"],"suppress_in_tutor_mode":true},
  "test_pause": {"name":"test_pause","phase":2,"tier":"interaction","parameters":["test_id","test_type","answered_count","total_questions"],"suppress_in_tutor_mode":true},
  "test_complete": {"name":"test_complete","phase":2,"tier":"outcome","parameters":["test_id","test_type","exam_category","total_questions","correct_count","score"],"suppress_in_tutor_mode":true},
  "test_tool_use": {"name":"test_tool_use","phase":2,"tier":"interaction","parameters":["tool_name","tool_state","test_id","test_type","question_number"],"suppress_in_tutor_mode":true},
  "question_mark_for_review": {"name":"question_mark_for_review","phase":2,"tier":"interaction","parameters":["test_type","question_number","marked","mark_source"],"suppress_in_tutor_mode":true},
  "test_results_view": {"name":"test_results_view","phase":2,"tier":"page","parameters":["test_id","test_type","results_source","correct_count","total_questions"],"suppress_in_tutor_mode":true},
  "review_question_open": {"name":"review_question_open","phase":2,"tier":"interaction","parameters":["review_source","test_type","is_correct"],"suppress_in_tutor_mode":true},
  "mistake_dismiss": {"name":"mistake_dismiss","phase":2,"tier":"interaction","parameters":["test_type"],"suppress_in_tutor_mode":true},
  "study_plan_cta_click": {"name":"study_plan_cta_click","phase":2,"tier":"interaction","parameters":["test_id","test_type"],"suppress_in_tutor_mode":true},
  "vocab_session_start": {"name":"vocab_session_start","phase":2,"tier":"interaction","parameters":["launch_source","card_count","category_id"]},
  "vocab_session_end": {"name":"vocab_session_end","phase":2,"tier":"interaction","parameters":["card_count","cards_viewed","completed"]},
  "score_calculator_use": {"name":"score_calculator_use","phase":2,"tier":"interaction","parameters":[]},
  "goal_set": {"name":"goal_set","phase":3,"tier":"interaction","parameters":["goal_type","score_value","days_until_test","is_cleared"]},
  "exam_category_select": {"name":"exam_category_select","phase":3,"tier":"interaction","parameters":["exam_category","previous_exam_category"]},
  "study_plan_wizard_step": {"name":"study_plan_wizard_step","phase":3,"tier":"interaction","parameters":["step_number","step_name"]},
  "study_plan_generate": {"name":"study_plan_generate","phase":3,"tier":"outcome","parameters":["plan_source","plan_weeks","test_type","study_days_count"]},
  "study_plan_generate_error": {"name":"study_plan_generate_error","phase":3,"tier":"system","parameters":["plan_source","error_code"]},
  "study_plan_open": {"name":"study_plan_open","phase":3,"tier":"interaction","parameters":["plan_source","plan_weeks"],"suppress_in_tutor_mode":true},
  "study_session_start_click": {"name":"study_session_start_click","phase":3,"tier":"interaction","parameters":["has_plan"]},
  "study_plan_delete": {"name":"study_plan_delete","phase":3,"tier":"interaction","parameters":["plan_source"]},
  "task_create": {"name":"task_create","phase":3,"tier":"interaction","parameters":["task_source"],"suppress_in_tutor_mode":true},
  "task_status_change": {"name":"task_status_change","phase":3,"tier":"interaction","parameters":["task_source","from_status","to_status","task_week"],"suppress_in_tutor_mode":true},
  "subtask_complete": {"name":"subtask_complete","phase":3,"tier":"outcome","parameters":["task_source","subtask_type"],"suppress_in_tutor_mode":true},
  "subtask_link_click": {"name":"subtask_link_click","phase":3,"tier":"interaction","parameters":["subtask_type","destination_template"],"suppress_in_tutor_mode":true},
  "task_delete": {"name":"task_delete","phase":3,"tier":"interaction","parameters":["task_source"],"suppress_in_tutor_mode":true},
  "progress_report_view": {"name":"progress_report_view","phase":3,"tier":"page","parameters":["viewed_scope"]},
  "assignment_open": {"name":"assignment_open","phase":3,"tier":"interaction","parameters":["test_id","assignment_type","is_overdue","days_until_due"]},
  "hub_card_click": {"name":"hub_card_click","phase":3,"tier":"interaction","parameters":["hub_id","card_id","destination_template"]},
  "home_cta_click": {"name":"home_cta_click","phase":3,"tier":"interaction","parameters":["cta_id","destination_template"]},
  "view_promotion": {"name":"view_promotion","phase":3,"tier":"page","parameters":["promotion_id","promotion_name","creative_slot"]},
  "select_promotion": {"name":"select_promotion","phase":3,"tier":"interaction","parameters":["promotion_id","promotion_name","creative_slot"]},
  "promotion_dismiss": {"name":"promotion_dismiss","phase":3,"tier":"interaction","parameters":["promotion_id","creative_slot"]},
  "ai_request": {"name":"ai_request","phase":4,"tier":"system","parameters":["ai_feature","ai_outcome","latency_ms","error_code","input_chars","output_chars","output_items","ai_result_score","turn_number","ai_request_id"]},
  "ai_output_copy": {"name":"ai_output_copy","phase":4,"tier":"interaction","parameters":["ai_feature"]},
  "ai_history_open": {"name":"ai_history_open","phase":4,"tier":"interaction","parameters":["ai_feature","result_age_days"]},
  "view_item_list": {"name":"view_item_list","phase":5,"tier":"page","parameters":["item_list_name","items"]},
  "select_item": {"name":"select_item","phase":5,"tier":"interaction","parameters":["item_list_name","items"]},
  "view_item": {"name":"view_item","phase":5,"tier":"page","parameters":["items"]},
  "catalog_filter_apply": {"name":"catalog_filter_apply","phase":5,"tier":"interaction","parameters":["content_type","filter_type"]},
  "video_start": {"name":"video_start","phase":5,"tier":"interaction","parameters":["content_type","content_id","video_provider","video_duration_sec"]},
  "video_progress": {"name":"video_progress","phase":5,"tier":"interaction","parameters":["content_type","content_id","video_provider","video_percent","video_duration_sec"]},
  "video_complete": {"name":"video_complete","phase":5,"tier":"outcome","parameters":["content_type","content_id","video_provider","video_duration_sec"]},
  "tutorial_question_answer": {"name":"tutorial_question_answer","phase":5,"tier":"interaction","parameters":["content_id","is_correct"]},
  "tutorial_category_complete": {"name":"tutorial_category_complete","phase":5,"tier":"outcome","parameters":["category_id"]},
  "course_lesson_complete": {"name":"course_lesson_complete","phase":5,"tier":"outcome","parameters":["content_id","lesson_number","course_progress_pct"]},
  "course_complete": {"name":"course_complete","phase":5,"tier":"outcome","parameters":["content_id"]},
  "course_review_submit": {"name":"course_review_submit","phase":5,"tier":"interaction","parameters":["content_id","rating","is_update"]},
  "live_session_join": {"name":"live_session_join","phase":5,"tier":"outcome","parameters":["content_type","content_id","minutes_to_start"]},
  "class_material_open": {"name":"class_material_open","phase":5,"tier":"interaction","parameters":["content_type","content_id","material_type"]},
  "event_attend_toggle": {"name":"event_attend_toggle","phase":5,"tier":"interaction","parameters":["content_id","attending"]},
  "content_favorite": {"name":"content_favorite","phase":5,"tier":"interaction","parameters":["content_type","content_id","favorited"]},
  "event_invite_send": {"name":"event_invite_send","phase":5,"tier":"interaction","parameters":["content_id"]},
  "content_view": {"name":"content_view","phase":5,"tier":"page","parameters":["content_type","content_id","profile_role"]},
  "outbound_link_click": {"name":"outbound_link_click","phase":5,"tier":"interaction","parameters":["content_type","content_id","link_type"]},
  "add_to_cart": {"name":"add_to_cart","phase":6,"tier":"interaction","parameters":["items","value","currency"]},
  "remove_from_cart": {"name":"remove_from_cart","phase":6,"tier":"interaction","parameters":["items","value","currency"]},
  "view_cart": {"name":"view_cart","phase":6,"tier":"page","parameters":["items","value","currency"]},
  "begin_checkout": {"name":"begin_checkout","phase":6,"tier":"outcome","parameters":["items","value","currency","coupon","checkout_type"]},
  "checkout_session_error": {"name":"checkout_session_error","phase":6,"tier":"system","parameters":["checkout_type","error_code"]},
  "checkout_return": {"name":"checkout_return","phase":6,"tier":"page","parameters":["checkout_type","return_status"]},
  "purchase": {"name":"purchase","phase":6,"tier":"outcome","parameters":["transaction_id","items","value","currency","coupon","checkout_type"],"server_only":true},
  "refund": {"name":"refund","phase":6,"tier":"outcome","parameters":["transaction_id","value","currency","items"],"server_only":true},
  "course_enroll": {"name":"course_enroll","phase":6,"tier":"outcome","parameters":["items"]},
  "coupon_apply": {"name":"coupon_apply","phase":6,"tier":"interaction","parameters":["coupon","coupon_result","discount_type"]},
  "subscription_change": {"name":"subscription_change","phase":6,"tier":"outcome","parameters":["subscription_type","change_type","from_plan","to_plan"]},
  "donation_open": {"name":"donation_open","phase":6,"tier":"interaction","parameters":["entry_point"]},
  "student_work_view": {"name":"student_work_view","phase":7,"tier":"page","parameters":["work_type","test_type"]},
  "student_plan_edit": {"name":"student_plan_edit","phase":7,"tier":"interaction","parameters":["edit_type"]},
  "test_assign": {"name":"test_assign","phase":7,"tier":"outcome","parameters":["test_id","test_type","assign_target","assigned_count","has_due_date"]},
  "invitation_send": {"name":"invitation_send","phase":7,"tier":"outcome","parameters":["invitee_role","is_resend"]},
  "invitation_cancel": {"name":"invitation_cancel","phase":7,"tier":"interaction","parameters":["invitee_role"]},
  "tutor_email_send": {"name":"tutor_email_send","phase":7,"tier":"interaction","parameters":["email_segment","recipient_count","template_id"]},
  "email_unsubscribe": {"name":"email_unsubscribe","phase":7,"tier":"interaction","parameters":[]},
  "content_create": {"name":"content_create","phase":7,"tier":"interaction","parameters":["content_type","creation_method"]},
  "content_update": {"name":"content_update","phase":7,"tier":"interaction","parameters":["content_type"]},
  "content_publish": {"name":"content_publish","phase":7,"tier":"outcome","parameters":["content_type","published"]},
  "content_delete": {"name":"content_delete","phase":7,"tier":"interaction","parameters":["content_type"]},
  "class_material_add": {"name":"class_material_add","phase":7,"tier":"interaction","parameters":["material_type"]},
  "session_note_create": {"name":"session_note_create","phase":7,"tier":"interaction","parameters":[]},
  "session_note_share": {"name":"session_note_share","phase":7,"tier":"interaction","parameters":["shared"]},
  "availability_update": {"name":"availability_update","phase":7,"tier":"interaction","parameters":["days_available","hours_per_week"]},
  "verification_call_book_click": {"name":"verification_call_book_click","phase":7,"tier":"interaction","parameters":[]},
  "tutor_insights_view": {"name":"tutor_insights_view","phase":7,"tier":"page","parameters":["insight_type"]},
  "session_booking_open": {"name":"session_booking_open","phase":7,"tier":"interaction","parameters":[]},
  "session_slot_select": {"name":"session_slot_select","phase":7,"tier":"interaction","parameters":["days_ahead"]},
  "post_create": {"name":"post_create","phase":8,"tier":"outcome","parameters":["surface","post_type","has_media"]},
  "post_react": {"name":"post_react","phase":8,"tier":"interaction","parameters":["surface","reaction_type","active"]},
  "post_share": {"name":"post_share","phase":8,"tier":"interaction","parameters":["surface"]},
  "poll_vote": {"name":"poll_vote","phase":8,"tier":"interaction","parameters":["surface"]},
  "comment_post": {"name":"comment_post","phase":8,"tier":"outcome","parameters":["content_type","surface"]},
  "comment_upvote": {"name":"comment_upvote","phase":8,"tier":"interaction","parameters":["content_type","active"]},
  "space_follow": {"name":"space_follow","phase":8,"tier":"interaction","parameters":["followed"]},
  "conversation_start": {"name":"conversation_start","phase":8,"tier":"outcome","parameters":["conversation_type","entry_point","member_count"]},
  "message_send": {"name":"message_send","phase":8,"tier":"outcome","parameters":["conversation_type","message_type","surface"]},
  "notifications_dropdown_open": {"name":"notifications_dropdown_open","phase":8,"tier":"interaction","parameters":["unread_count"]},
  "notification_open": {"name":"notification_open","phase":8,"tier":"interaction","parameters":["notification_type"]},
  "notification_pref_change": {"name":"notification_pref_change","phase":8,"tier":"interaction","parameters":["notification_type","channel","enabled"]},
  "support_chat_open": {"name":"support_chat_open","phase":8,"tier":"interaction","parameters":[]},
  "support_message_send": {"name":"support_message_send","phase":8,"tier":"interaction","parameters":["is_first_message"]},
  "faq_open": {"name":"faq_open","phase":8,"tier":"interaction","parameters":["faq_id"]},
  "feedback_submit": {"name":"feedback_submit","phase":8,"tier":"outcome","parameters":["rating"]},
  "profile_update": {"name":"profile_update","phase":8,"tier":"interaction","parameters":["profile_section"]},
  "connection_request_send": {"name":"connection_request_send","phase":8,"tier":"interaction","parameters":["profile_role"]},
  "connection_respond": {"name":"connection_respond","phase":8,"tier":"interaction","parameters":["accepted"]},
  "connection_remove": {"name":"connection_remove","phase":8,"tier":"interaction","parameters":[]},
} as const;

/** Events suppressed when in tutor mode (student activity). */
export const TUTOR_MODE_SUPPRESSED: ReadonlySet<string> = new Set(["test_start","test_resume","test_restart","question_answer","test_module_start","test_pause","test_complete","test_tool_use","question_mark_for_review","test_results_view","review_question_open","mistake_dismiss","study_plan_cta_click","study_plan_open","task_create","task_status_change","subtask_complete","subtask_link_click","task_delete"]);

/** Set of all valid client event names for fast lookup. */
export const CLIENT_EVENT_SET: ReadonlySet<string> = new Set(["page_view","navigation_click","search","view_search_results","select_content","role_select","sign_up_start","sign_up","email_verify","verification_email_resend","login","logout","auth_error","password_reset_request","invitation_view","invitation_accept","invitation_decline","post_invite_class_select","share","generate_lead","sign_up_prompt_click","limit_hit","upgrade_cta_click","content_block","exception","web_vitals","scroll_milestone","test_generate","test_start","test_resume","test_restart","question_answer","test_module_start","test_pause","test_complete","test_tool_use","question_mark_for_review","test_results_view","review_question_open","mistake_dismiss","study_plan_cta_click","vocab_session_start","vocab_session_end","score_calculator_use","goal_set","exam_category_select","study_plan_wizard_step","study_plan_generate","study_plan_generate_error","study_plan_open","study_session_start_click","study_plan_delete","task_create","task_status_change","subtask_complete","subtask_link_click","task_delete","progress_report_view","assignment_open","hub_card_click","home_cta_click","view_promotion","select_promotion","promotion_dismiss","ai_request","ai_output_copy","ai_history_open","view_item_list","select_item","view_item","catalog_filter_apply","video_start","video_progress","video_complete","tutorial_question_answer","tutorial_category_complete","course_lesson_complete","course_complete","course_review_submit","live_session_join","class_material_open","event_attend_toggle","content_favorite","event_invite_send","content_view","outbound_link_click","add_to_cart","remove_from_cart","view_cart","begin_checkout","checkout_session_error","checkout_return","course_enroll","coupon_apply","subscription_change","donation_open","student_work_view","student_plan_edit","test_assign","invitation_send","invitation_cancel","tutor_email_send","email_unsubscribe","content_create","content_update","content_publish","content_delete","class_material_add","session_note_create","session_note_share","availability_update","verification_call_book_click","tutor_insights_view","session_booking_open","session_slot_select","post_create","post_react","post_share","poll_vote","comment_post","comment_upvote","space_follow","conversation_start","message_send","notifications_dropdown_open","notification_open","notification_pref_change","support_chat_open","support_message_send","faq_open","feedback_submit","profile_update","connection_request_send","connection_respond","connection_remove"]);

/** Allowed parameter names per event. */
export const EVENT_PARAMS: Record<EventName, ReadonlySet<string>> = {
  "page_view": new Set(["is_public_view"]),
  "navigation_click": new Set(["nav_item_id","nav_section_id","destination_template"]),
  "search": new Set(["search_term","search_origin"]),
  "view_search_results": new Set(["search_term","results_count"]),
  "select_content": new Set(["content_type","content_id","list_position","test_type","list_name"]),
  "role_select": new Set(["selected_role","has_referral","has_invitation"]),
  "sign_up_start": new Set(["method"]),
  "sign_up": new Set(["method","signup_source","inviter_role","requires_verification"]),
  "email_verify": new Set(["verification_mode"]),
  "verification_email_resend": new Set([]),
  "login": new Set(["method"]),
  "logout": new Set([]),
  "auth_error": new Set(["auth_stage","method","error_code"]),
  "password_reset_request": new Set([]),
  "invitation_view": new Set(["inviter_role","invitation_valid"]),
  "invitation_accept": new Set(["inviter_role","existing_account"]),
  "invitation_decline": new Set(["inviter_role"]),
  "post_invite_class_select": new Set(["class_plan_id","skipped"]),
  "share": new Set(["method","content_type"]),
  "generate_lead": new Set(["lead_type","test_id"]),
  "sign_up_prompt_click": new Set(["cta_type"]),
  "limit_hit": new Set(["limit_type","feature_type","gated_action","endpoint_template"]),
  "upgrade_cta_click": new Set(["limit_type","cta_destination"]),
  "content_block": new Set(["endpoint_template"]),
  "exception": new Set(["description","fatal","http_status","endpoint_template"]),
  "web_vitals": new Set(["metric_name","metric_value","metric_rating"]),
  "scroll_milestone": new Set(["scroll_percent"]),
  "test_generate": new Set(["test_id","test_type","creation_method","question_count","difficulty","only_new_questions","category_id"]),
  "test_start": new Set(["test_id","test_type","exam_category","total_questions","section_count"]),
  "test_resume": new Set(["test_id","test_type","answered_count","total_questions"]),
  "test_restart": new Set(["test_id","test_type","restart_source"]),
  "question_answer": new Set(["test_id","test_type","section_number","question_number","duration_sec","answer_changed","answer_format"]),
  "test_module_start": new Set(["test_id","test_type","module_number","section_number"]),
  "test_pause": new Set(["test_id","test_type","answered_count","total_questions"]),
  "test_complete": new Set(["test_id","test_type","exam_category","total_questions","correct_count","score"]),
  "test_tool_use": new Set(["tool_name","tool_state","test_id","test_type","question_number"]),
  "question_mark_for_review": new Set(["test_type","question_number","marked","mark_source"]),
  "test_results_view": new Set(["test_id","test_type","results_source","correct_count","total_questions"]),
  "review_question_open": new Set(["review_source","test_type","is_correct"]),
  "mistake_dismiss": new Set(["test_type"]),
  "study_plan_cta_click": new Set(["test_id","test_type"]),
  "vocab_session_start": new Set(["launch_source","card_count","category_id"]),
  "vocab_session_end": new Set(["card_count","cards_viewed","completed"]),
  "score_calculator_use": new Set([]),
  "goal_set": new Set(["goal_type","score_value","days_until_test","is_cleared"]),
  "exam_category_select": new Set(["exam_category","previous_exam_category"]),
  "study_plan_wizard_step": new Set(["step_number","step_name"]),
  "study_plan_generate": new Set(["plan_source","plan_weeks","test_type","study_days_count"]),
  "study_plan_generate_error": new Set(["plan_source","error_code"]),
  "study_plan_open": new Set(["plan_source","plan_weeks"]),
  "study_session_start_click": new Set(["has_plan"]),
  "study_plan_delete": new Set(["plan_source"]),
  "task_create": new Set(["task_source"]),
  "task_status_change": new Set(["task_source","from_status","to_status","task_week"]),
  "subtask_complete": new Set(["task_source","subtask_type"]),
  "subtask_link_click": new Set(["subtask_type","destination_template"]),
  "task_delete": new Set(["task_source"]),
  "progress_report_view": new Set(["viewed_scope"]),
  "assignment_open": new Set(["test_id","assignment_type","is_overdue","days_until_due"]),
  "hub_card_click": new Set(["hub_id","card_id","destination_template"]),
  "home_cta_click": new Set(["cta_id","destination_template"]),
  "view_promotion": new Set(["promotion_id","promotion_name","creative_slot"]),
  "select_promotion": new Set(["promotion_id","promotion_name","creative_slot"]),
  "promotion_dismiss": new Set(["promotion_id","creative_slot"]),
  "ai_request": new Set(["ai_feature","ai_outcome","latency_ms","error_code","input_chars","output_chars","output_items","ai_result_score","turn_number","ai_request_id"]),
  "ai_output_copy": new Set(["ai_feature"]),
  "ai_history_open": new Set(["ai_feature","result_age_days"]),
  "view_item_list": new Set(["item_list_name","items"]),
  "select_item": new Set(["item_list_name","items"]),
  "view_item": new Set(["items"]),
  "catalog_filter_apply": new Set(["content_type","filter_type"]),
  "video_start": new Set(["content_type","content_id","video_provider","video_duration_sec"]),
  "video_progress": new Set(["content_type","content_id","video_provider","video_percent","video_duration_sec"]),
  "video_complete": new Set(["content_type","content_id","video_provider","video_duration_sec"]),
  "tutorial_question_answer": new Set(["content_id","is_correct"]),
  "tutorial_category_complete": new Set(["category_id"]),
  "course_lesson_complete": new Set(["content_id","lesson_number","course_progress_pct"]),
  "course_complete": new Set(["content_id"]),
  "course_review_submit": new Set(["content_id","rating","is_update"]),
  "live_session_join": new Set(["content_type","content_id","minutes_to_start"]),
  "class_material_open": new Set(["content_type","content_id","material_type"]),
  "event_attend_toggle": new Set(["content_id","attending"]),
  "content_favorite": new Set(["content_type","content_id","favorited"]),
  "event_invite_send": new Set(["content_id"]),
  "content_view": new Set(["content_type","content_id","profile_role"]),
  "outbound_link_click": new Set(["content_type","content_id","link_type"]),
  "add_to_cart": new Set(["items","value","currency"]),
  "remove_from_cart": new Set(["items","value","currency"]),
  "view_cart": new Set(["items","value","currency"]),
  "begin_checkout": new Set(["items","value","currency","coupon","checkout_type"]),
  "checkout_session_error": new Set(["checkout_type","error_code"]),
  "checkout_return": new Set(["checkout_type","return_status"]),
  "purchase": new Set(["transaction_id","items","value","currency","coupon","checkout_type"]),
  "refund": new Set(["transaction_id","value","currency","items"]),
  "course_enroll": new Set(["items"]),
  "coupon_apply": new Set(["coupon","coupon_result","discount_type"]),
  "subscription_change": new Set(["subscription_type","change_type","from_plan","to_plan"]),
  "donation_open": new Set(["entry_point"]),
  "student_work_view": new Set(["work_type","test_type"]),
  "student_plan_edit": new Set(["edit_type"]),
  "test_assign": new Set(["test_id","test_type","assign_target","assigned_count","has_due_date"]),
  "invitation_send": new Set(["invitee_role","is_resend"]),
  "invitation_cancel": new Set(["invitee_role"]),
  "tutor_email_send": new Set(["email_segment","recipient_count","template_id"]),
  "email_unsubscribe": new Set([]),
  "content_create": new Set(["content_type","creation_method"]),
  "content_update": new Set(["content_type"]),
  "content_publish": new Set(["content_type","published"]),
  "content_delete": new Set(["content_type"]),
  "class_material_add": new Set(["material_type"]),
  "session_note_create": new Set([]),
  "session_note_share": new Set(["shared"]),
  "availability_update": new Set(["days_available","hours_per_week"]),
  "verification_call_book_click": new Set([]),
  "tutor_insights_view": new Set(["insight_type"]),
  "session_booking_open": new Set([]),
  "session_slot_select": new Set(["days_ahead"]),
  "post_create": new Set(["surface","post_type","has_media"]),
  "post_react": new Set(["surface","reaction_type","active"]),
  "post_share": new Set(["surface"]),
  "poll_vote": new Set(["surface"]),
  "comment_post": new Set(["content_type","surface"]),
  "comment_upvote": new Set(["content_type","active"]),
  "space_follow": new Set(["followed"]),
  "conversation_start": new Set(["conversation_type","entry_point","member_count"]),
  "message_send": new Set(["conversation_type","message_type","surface"]),
  "notifications_dropdown_open": new Set(["unread_count"]),
  "notification_open": new Set(["notification_type"]),
  "notification_pref_change": new Set(["notification_type","channel","enabled"]),
  "support_chat_open": new Set([]),
  "support_message_send": new Set(["is_first_message"]),
  "faq_open": new Set(["faq_id"]),
  "feedback_submit": new Set(["rating"]),
  "profile_update": new Set(["profile_section"]),
  "connection_request_send": new Set(["profile_role"]),
  "connection_respond": new Set(["accepted"]),
  "connection_remove": new Set([]),
} as const;

/** Parameter type definitions. */
export const PARAM_TYPES: Record<string, string> = {
  "accepted": "boolean",
  "active": "boolean",
  "ai_feature": "string",
  "ai_outcome": "string",
  "ai_request_id": "string",
  "ai_result_score": "number",
  "answer_changed": "boolean",
  "answer_format": "string",
  "answered_count": "integer",
  "assign_target": "string",
  "assigned_count": "integer",
  "assignment_type": "string",
  "attending": "boolean",
  "auth_stage": "string",
  "card_count": "integer",
  "card_id": "string",
  "cards_viewed": "integer",
  "category_id": "string",
  "change_type": "string",
  "channel": "string",
  "checkout_type": "string",
  "class_plan_id": "string",
  "completed": "boolean",
  "content_id": "string",
  "content_type": "string",
  "conversation_type": "string",
  "correct_count": "integer",
  "coupon": "string",
  "coupon_result": "string",
  "course_progress_pct": "integer",
  "creation_method": "string",
  "creative_slot": "string",
  "cta_destination": "string",
  "cta_id": "string",
  "cta_type": "string",
  "currency": "string",
  "days_ahead": "integer",
  "days_available": "integer",
  "days_until_due": "integer",
  "days_until_test": "integer",
  "description": "string",
  "destination_template": "string",
  "difficulty": "string",
  "discount_type": "string",
  "duration_sec": "integer",
  "edit_type": "string",
  "email_segment": "string",
  "enabled": "boolean",
  "endpoint_template": "string",
  "entry_point": "string",
  "error_code": "string",
  "exam_category": "string",
  "existing_account": "boolean",
  "faq_id": "string",
  "fatal": "boolean",
  "favorited": "boolean",
  "feature_type": "string",
  "filter_type": "string",
  "followed": "boolean",
  "from_plan": "string",
  "from_status": "string",
  "gated_action": "string",
  "goal_type": "string",
  "has_due_date": "boolean",
  "has_invitation": "boolean",
  "has_media": "boolean",
  "has_plan": "boolean",
  "has_referral": "boolean",
  "hours_per_week": "integer",
  "http_status": "integer",
  "hub_id": "string",
  "input_chars": "integer",
  "insight_type": "string",
  "invitation_valid": "boolean",
  "invitee_role": "string",
  "inviter_role": "string",
  "is_cleared": "boolean",
  "is_correct": "boolean",
  "is_first_message": "boolean",
  "is_overdue": "boolean",
  "is_public_view": "boolean",
  "is_resend": "boolean",
  "is_update": "boolean",
  "item_list_name": "string",
  "items": "array",
  "latency_ms": "integer",
  "launch_source": "string",
  "lead_type": "string",
  "lesson_number": "integer",
  "limit_type": "string",
  "link_type": "string",
  "list_name": "string",
  "list_position": "integer",
  "mark_source": "string",
  "marked": "boolean",
  "material_type": "string",
  "member_count": "integer",
  "message_type": "string",
  "method": "string",
  "metric_name": "string",
  "metric_rating": "string",
  "metric_value": "integer",
  "minutes_to_start": "integer",
  "module_number": "integer",
  "nav_item_id": "string",
  "nav_section_id": "string",
  "notification_type": "string",
  "only_new_questions": "boolean",
  "output_chars": "integer",
  "output_items": "integer",
  "plan_source": "string",
  "plan_weeks": "integer",
  "post_type": "string",
  "previous_exam_category": "string",
  "profile_role": "string",
  "profile_section": "string",
  "promotion_id": "string",
  "promotion_name": "string",
  "published": "boolean",
  "question_count": "integer",
  "question_number": "integer",
  "rating": "integer",
  "reaction_type": "string",
  "recipient_count": "integer",
  "requires_verification": "boolean",
  "restart_source": "string",
  "result_age_days": "integer",
  "results_count": "integer",
  "results_source": "string",
  "return_status": "string",
  "review_source": "string",
  "score": "number",
  "score_value": "integer",
  "scroll_percent": "integer",
  "search_origin": "string",
  "search_term": "string",
  "section_count": "integer",
  "section_number": "integer",
  "selected_role": "string",
  "shared": "boolean",
  "signup_source": "string",
  "skipped": "boolean",
  "step_name": "string",
  "step_number": "integer",
  "study_days_count": "integer",
  "subscription_type": "string",
  "subtask_type": "string",
  "surface": "string",
  "task_source": "string",
  "task_week": "integer",
  "template_id": "string",
  "test_id": "string",
  "test_type": "string",
  "to_plan": "string",
  "to_status": "string",
  "tool_name": "string",
  "tool_state": "string",
  "total_questions": "integer",
  "transaction_id": "string",
  "turn_number": "integer",
  "unread_count": "integer",
  "value": "number",
  "verification_mode": "string",
  "video_duration_sec": "integer",
  "video_percent": "integer",
  "video_provider": "string",
  "viewed_scope": "string",
  "work_type": "string",
} as const;

/** Typed parameter map per client event. Used by track() for compile-time checking. */
export interface EventParamsMap {
  "page_view": {
    is_public_view?: boolean;
  };
  "navigation_click": {
    nav_item_id?: string;
    nav_section_id?: string;
    destination_template?: string;
  };
  "search": {
    search_term?: string;
    search_origin?: string;
  };
  "view_search_results": {
    search_term?: string;
    results_count?: number;
  };
  "select_content": {
    content_type?: string;
    content_id?: string;
    list_position?: number;
    test_type?: string;
    list_name?: string;
  };
  "role_select": {
    selected_role?: string;
    has_referral?: boolean;
    has_invitation?: boolean;
  };
  "sign_up_start": {
    method?: string;
  };
  "sign_up": {
    method?: string;
    signup_source?: string;
    inviter_role?: string;
    requires_verification?: boolean;
  };
  "email_verify": {
    verification_mode?: string;
  };
  "verification_email_resend": Record<string, never>;
  "login": {
    method?: string;
  };
  "logout": Record<string, never>;
  "auth_error": {
    auth_stage?: string;
    method?: string;
    error_code?: string;
  };
  "password_reset_request": Record<string, never>;
  "invitation_view": {
    inviter_role?: string;
    invitation_valid?: boolean;
  };
  "invitation_accept": {
    inviter_role?: string;
    existing_account?: boolean;
  };
  "invitation_decline": {
    inviter_role?: string;
  };
  "post_invite_class_select": {
    class_plan_id?: string;
    skipped?: boolean;
  };
  "share": {
    method?: string;
    content_type?: string;
  };
  "generate_lead": {
    lead_type?: string;
    test_id?: string;
  };
  "sign_up_prompt_click": {
    cta_type?: string;
  };
  "limit_hit": {
    limit_type?: string;
    feature_type?: string;
    gated_action?: string;
    endpoint_template?: string;
  };
  "upgrade_cta_click": {
    limit_type?: string;
    cta_destination?: string;
  };
  "content_block": {
    endpoint_template?: string;
  };
  "exception": {
    description?: string;
    fatal?: boolean;
    http_status?: number;
    endpoint_template?: string;
  };
  "web_vitals": {
    metric_name?: string;
    metric_value?: number;
    metric_rating?: string;
  };
  "scroll_milestone": {
    scroll_percent?: number;
  };
  "test_generate": {
    test_id?: string;
    test_type?: string;
    creation_method?: string;
    question_count?: number;
    difficulty?: string;
    only_new_questions?: boolean;
    category_id?: string;
  };
  "test_start": {
    test_id?: string;
    test_type?: string;
    exam_category?: string;
    total_questions?: number;
    section_count?: number;
  };
  "test_resume": {
    test_id?: string;
    test_type?: string;
    answered_count?: number;
    total_questions?: number;
  };
  "test_restart": {
    test_id?: string;
    test_type?: string;
    restart_source?: string;
  };
  "question_answer": {
    test_id?: string;
    test_type?: string;
    section_number?: number;
    question_number?: number;
    duration_sec?: number;
    answer_changed?: boolean;
    answer_format?: string;
  };
  "test_module_start": {
    test_id?: string;
    test_type?: string;
    module_number?: number;
    section_number?: number;
  };
  "test_pause": {
    test_id?: string;
    test_type?: string;
    answered_count?: number;
    total_questions?: number;
  };
  "test_complete": {
    test_id?: string;
    test_type?: string;
    exam_category?: string;
    total_questions?: number;
    correct_count?: number;
    score?: number;
  };
  "test_tool_use": {
    tool_name?: string;
    tool_state?: string;
    test_id?: string;
    test_type?: string;
    question_number?: number;
  };
  "question_mark_for_review": {
    test_type?: string;
    question_number?: number;
    marked?: boolean;
    mark_source?: string;
  };
  "test_results_view": {
    test_id?: string;
    test_type?: string;
    results_source?: string;
    correct_count?: number;
    total_questions?: number;
  };
  "review_question_open": {
    review_source?: string;
    test_type?: string;
    is_correct?: boolean;
  };
  "mistake_dismiss": {
    test_type?: string;
  };
  "study_plan_cta_click": {
    test_id?: string;
    test_type?: string;
  };
  "vocab_session_start": {
    launch_source?: string;
    card_count?: number;
    category_id?: string;
  };
  "vocab_session_end": {
    card_count?: number;
    cards_viewed?: number;
    completed?: boolean;
  };
  "score_calculator_use": Record<string, never>;
  "goal_set": {
    goal_type?: string;
    score_value?: number;
    days_until_test?: number;
    is_cleared?: boolean;
  };
  "exam_category_select": {
    exam_category?: string;
    previous_exam_category?: string;
  };
  "study_plan_wizard_step": {
    step_number?: number;
    step_name?: string;
  };
  "study_plan_generate": {
    plan_source?: string;
    plan_weeks?: number;
    test_type?: string;
    study_days_count?: number;
  };
  "study_plan_generate_error": {
    plan_source?: string;
    error_code?: string;
  };
  "study_plan_open": {
    plan_source?: string;
    plan_weeks?: number;
  };
  "study_session_start_click": {
    has_plan?: boolean;
  };
  "study_plan_delete": {
    plan_source?: string;
  };
  "task_create": {
    task_source?: string;
  };
  "task_status_change": {
    task_source?: string;
    from_status?: string;
    to_status?: string;
    task_week?: number;
  };
  "subtask_complete": {
    task_source?: string;
    subtask_type?: string;
  };
  "subtask_link_click": {
    subtask_type?: string;
    destination_template?: string;
  };
  "task_delete": {
    task_source?: string;
  };
  "progress_report_view": {
    viewed_scope?: string;
  };
  "assignment_open": {
    test_id?: string;
    assignment_type?: string;
    is_overdue?: boolean;
    days_until_due?: number;
  };
  "hub_card_click": {
    hub_id?: string;
    card_id?: string;
    destination_template?: string;
  };
  "home_cta_click": {
    cta_id?: string;
    destination_template?: string;
  };
  "view_promotion": {
    promotion_id?: string;
    promotion_name?: string;
    creative_slot?: string;
  };
  "select_promotion": {
    promotion_id?: string;
    promotion_name?: string;
    creative_slot?: string;
  };
  "promotion_dismiss": {
    promotion_id?: string;
    creative_slot?: string;
  };
  "ai_request": {
    ai_feature?: string;
    ai_outcome?: string;
    latency_ms?: number;
    error_code?: string;
    input_chars?: number;
    output_chars?: number;
    output_items?: number;
    ai_result_score?: number;
    turn_number?: number;
    ai_request_id?: string;
  };
  "ai_output_copy": {
    ai_feature?: string;
  };
  "ai_history_open": {
    ai_feature?: string;
    result_age_days?: number;
  };
  "view_item_list": {
    item_list_name?: string;
    items?: unknown[];
  };
  "select_item": {
    item_list_name?: string;
    items?: unknown[];
  };
  "view_item": {
    items?: unknown[];
  };
  "catalog_filter_apply": {
    content_type?: string;
    filter_type?: string;
  };
  "video_start": {
    content_type?: string;
    content_id?: string;
    video_provider?: string;
    video_duration_sec?: number;
  };
  "video_progress": {
    content_type?: string;
    content_id?: string;
    video_provider?: string;
    video_percent?: number;
    video_duration_sec?: number;
  };
  "video_complete": {
    content_type?: string;
    content_id?: string;
    video_provider?: string;
    video_duration_sec?: number;
  };
  "tutorial_question_answer": {
    content_id?: string;
    is_correct?: boolean;
  };
  "tutorial_category_complete": {
    category_id?: string;
  };
  "course_lesson_complete": {
    content_id?: string;
    lesson_number?: number;
    course_progress_pct?: number;
  };
  "course_complete": {
    content_id?: string;
  };
  "course_review_submit": {
    content_id?: string;
    rating?: number;
    is_update?: boolean;
  };
  "live_session_join": {
    content_type?: string;
    content_id?: string;
    minutes_to_start?: number;
  };
  "class_material_open": {
    content_type?: string;
    content_id?: string;
    material_type?: string;
  };
  "event_attend_toggle": {
    content_id?: string;
    attending?: boolean;
  };
  "content_favorite": {
    content_type?: string;
    content_id?: string;
    favorited?: boolean;
  };
  "event_invite_send": {
    content_id?: string;
  };
  "content_view": {
    content_type?: string;
    content_id?: string;
    profile_role?: string;
  };
  "outbound_link_click": {
    content_type?: string;
    content_id?: string;
    link_type?: string;
  };
  "add_to_cart": {
    items?: unknown[];
    value?: number;
    currency?: string;
  };
  "remove_from_cart": {
    items?: unknown[];
    value?: number;
    currency?: string;
  };
  "view_cart": {
    items?: unknown[];
    value?: number;
    currency?: string;
  };
  "begin_checkout": {
    items?: unknown[];
    value?: number;
    currency?: string;
    coupon?: string;
    checkout_type?: string;
  };
  "checkout_session_error": {
    checkout_type?: string;
    error_code?: string;
  };
  "checkout_return": {
    checkout_type?: string;
    return_status?: string;
  };
  "course_enroll": {
    items?: unknown[];
  };
  "coupon_apply": {
    coupon?: string;
    coupon_result?: string;
    discount_type?: string;
  };
  "subscription_change": {
    subscription_type?: string;
    change_type?: string;
    from_plan?: string;
    to_plan?: string;
  };
  "donation_open": {
    entry_point?: string;
  };
  "student_work_view": {
    work_type?: string;
    test_type?: string;
  };
  "student_plan_edit": {
    edit_type?: string;
  };
  "test_assign": {
    test_id?: string;
    test_type?: string;
    assign_target?: string;
    assigned_count?: number;
    has_due_date?: boolean;
  };
  "invitation_send": {
    invitee_role?: string;
    is_resend?: boolean;
  };
  "invitation_cancel": {
    invitee_role?: string;
  };
  "tutor_email_send": {
    email_segment?: string;
    recipient_count?: number;
    template_id?: string;
  };
  "email_unsubscribe": Record<string, never>;
  "content_create": {
    content_type?: string;
    creation_method?: string;
  };
  "content_update": {
    content_type?: string;
  };
  "content_publish": {
    content_type?: string;
    published?: boolean;
  };
  "content_delete": {
    content_type?: string;
  };
  "class_material_add": {
    material_type?: string;
  };
  "session_note_create": Record<string, never>;
  "session_note_share": {
    shared?: boolean;
  };
  "availability_update": {
    days_available?: number;
    hours_per_week?: number;
  };
  "verification_call_book_click": Record<string, never>;
  "tutor_insights_view": {
    insight_type?: string;
  };
  "session_booking_open": Record<string, never>;
  "session_slot_select": {
    days_ahead?: number;
  };
  "post_create": {
    surface?: string;
    post_type?: string;
    has_media?: boolean;
  };
  "post_react": {
    surface?: string;
    reaction_type?: string;
    active?: boolean;
  };
  "post_share": {
    surface?: string;
  };
  "poll_vote": {
    surface?: string;
  };
  "comment_post": {
    content_type?: string;
    surface?: string;
  };
  "comment_upvote": {
    content_type?: string;
    active?: boolean;
  };
  "space_follow": {
    followed?: boolean;
  };
  "conversation_start": {
    conversation_type?: string;
    entry_point?: string;
    member_count?: number;
  };
  "message_send": {
    conversation_type?: string;
    message_type?: string;
    surface?: string;
  };
  "notifications_dropdown_open": {
    unread_count?: number;
  };
  "notification_open": {
    notification_type?: string;
  };
  "notification_pref_change": {
    notification_type?: string;
    channel?: string;
    enabled?: boolean;
  };
  "support_chat_open": Record<string, never>;
  "support_message_send": {
    is_first_message?: boolean;
  };
  "faq_open": {
    faq_id?: string;
  };
  "feedback_submit": {
    rating?: number;
  };
  "profile_update": {
    profile_section?: string;
  };
  "connection_request_send": {
    profile_role?: string;
  };
  "connection_respond": {
    accepted?: boolean;
  };
  "connection_remove": Record<string, never>;
}

/** Valid content group values. */
export type ContentGroup =
  | "account"
  | "home"
  | "practice"
  | "planning"
  | "learn"
  | "ai_tools"
  | "community"
  | "tutor_tools"
  | "settings"
  | "embed"
  ;

/** Route template to content group mapping. */
export const ROUTE_TO_GROUP: ReadonlyMap<string, ContentGroup> = new Map([
  ["/signin", "account"],
  ["/role-selection", "account"],
  ["/signup", "account"],
  ["/tutor-request", "account"],
  ["/invitation", "account"],
  ["/reset-password", "account"],
  ["/verify-email", "account"],
  ["/select-class", "account"],
  ["/unsubscribe", "account"],
  ["/", "home"],
  ["/dashboard", "home"],
  ["/start-here", "home"],
  ["/c/:categorySlug", "home"],
  ["/my-assignments", "home"],
  ["/search", "home"],
  ["/tests", "practice"],
  ["/tests/:testId/take", "practice"],
  ["/diagnostic-test", "practice"],
  ["/diagnostic-test/:testId/take", "practice"],
  ["/question-bank/categories", "practice"],
  ["/question-bank/test/:testId", "practice"],
  ["/question-bank/questions", "practice"],
  ["/challenge-questions", "practice"],
  ["/predicted-questions", "practice"],
  ["/predicted-questions/tests", "practice"],
  ["/predicted-questions/test/:testId", "practice"],
  ["/predicted-tests", "practice"],
  ["/predicted-tests/test/:testId", "practice"],
  ["/vocabulary", "practice"],
  ["/vocabulary/categories", "practice"],
  ["/vocabulary/launcher", "practice"],
  ["/vocabulary/session/:id", "practice"],
  ["/score-calculator", "practice"],
  ["/my-mistakes", "practice"],
  ["/my-mistakes/categories/:categoryId", "practice"],
  ["/saved-questions", "practice"],
  ["/saved-questions/categories/:categoryId", "practice"],
  ["/t/:testId", "practice"],
  ["/question-bank-hub", "practice"],
  ["/practice-tests-hub", "practice"],
  ["/study-plan", "planning"],
  ["/study-plan/list", "planning"],
  ["/study-plan/source/:source/:studyPlanId", "planning"],
  ["/study-plan/source/:source/:studyPlanId/:testType", "planning"],
  ["/study-plan/:testProgressId", "planning"],
  ["/study-plan/:testProgressId/:testType", "planning"],
  ["/tasks", "planning"],
  ["/tutorial-bank", "learn"],
  ["/tutorial-bank/category/:categoryId", "learn"],
  ["/tutorial-bank/tutorial/:categoryId/:tutorialId", "learn"],
  ["/courses", "learn"],
  ["/courses/my-courses", "learn"],
  ["/courses/course/:id", "learn"],
  ["/courses/learn/:courseId", "learn"],
  ["/courses/cart/review", "learn"],
  ["/courses/cart/confirmation", "learn"],
  ["/courses/payment/success", "learn"],
  ["/courses/payment/cancel", "learn"],
  ["/classes", "learn"],
  ["/classes/:id", "learn"],
  ["/calendar", "learn"],
  ["/calendar/event/:id", "learn"],
  ["/resources", "learn"],
  ["/resources/:id", "learn"],
  ["/colleges", "learn"],
  ["/colleges/:id", "learn"],
  ["/scholarships", "learn"],
  ["/scholarships/:id", "learn"],
  ["/internships", "learn"],
  ["/internships/:id", "learn"],
  ["/applicant-profiles", "learn"],
  ["/applicant-profiles/:id", "learn"],
  ["/essay-ideas", "learn"],
  ["/essay-ideas/list", "learn"],
  ["/essay-ideas/:id", "learn"],
  ["/essay-editor", "learn"],
  ["/essay-editor/list", "learn"],
  ["/essay-editor/:id", "learn"],
  ["/recommendation-letter", "learn"],
  ["/faqs", "learn"],
  ["/questions", "learn"],
  ["/tutorials-hub", "learn"],
  ["/college-admissions-hub", "learn"],
  ["/ai-prompts", "ai_tools"],
  ["/course-plans", "ai_tools"],
  ["/community/connections", "community"],
  ["/community/profile", "community"],
  ["/community/profile/:userId", "community"],
  ["/community/contacts", "community"],
  ["/community/members", "community"],
  ["/community/tutors", "community"],
  ["/community/parents", "community"],
  ["/community/feed", "community"],
  ["/community/post/:id", "community"],
  ["/communities/self", "community"],
  ["/communities/:tutorId", "community"],
  ["/my-communities", "community"],
  ["/my-tutors", "community"],
  ["/spaces", "community"],
  ["/spaces/:spaceId", "community"],
  ["/feed", "community"],
  ["/posts/:postId", "community"],
  ["/messages", "community"],
  ["/support", "community"],
  ["/community-hub", "community"],
  ["/test-bank/my-bank", "tutor_tools"],
  ["/test-bank/my-bank/:testId/edit", "tutor_tools"],
  ["/question-bank/my-bank", "tutor_tools"],
  ["/question-bank/my-bank/create", "tutor_tools"],
  ["/question-bank/my-bank/edit/:itemId", "tutor_tools"],
  ["/tutortube", "tutor_tools"],
  ["/tutortube/:videoId/analytics", "tutor_tools"],
  ["/email", "tutor_tools"],
  ["/my-students", "tutor_tools"],
  ["/my-classes", "tutor_tools"],
  ["/payments/sells", "tutor_tools"],
  ["/courses/create", "tutor_tools"],
  ["/courses/edit/:courseId", "tutor_tools"],
  ["/students-progress-hub", "tutor_tools"],
  ["/settings/account", "settings"],
  ["/settings/availability", "settings"],
  ["/settings/videos", "settings"],
  ["/settings/notifications", "settings"],
  ["/settings/apps", "settings"],
  ["/settings/plans", "settings"],
  ["/settings/billing", "settings"],
  ["/settings/feedback", "settings"],
  ["/settings/tutor-invitations", "settings"],
  ["/settings/student-invitations", "settings"],
  ["/settings/connected-apps", "settings"],
  ["/settings/parent-student-invitation", "settings"],
  ["/settings/subscription-success", "settings"],
  ["/settings/subscription-cancel", "settings"],
  ["/settings/subscription-change/:action/:subscriptionId", "settings"],
  ["/settings/subscription-cancel-confirm/:subscriptionId", "settings"],
  ["/settings/subscription-downgrade-free-confirm/:subscriptionId", "settings"],
  ["/settings/subscription-downgrade-monthly-confirm/:subscriptionId", "settings"],
  ["/settings/subscription-change/cancel/success", "settings"],
  ["/settings/subscription-change/downgrade-free/success", "settings"],
  ["/settings/subscription-change/downgrade-monthly/success", "settings"],
  ["/settings/subscription-change/:action/success", "settings"],
  ["/settings/subscription-history", "settings"],
  ["/settings/subscription-upgrade-yearly-confirm/:subscriptionId", "settings"],
  ["/settings/subscription-upgrade-yearly/success", "settings"],
  ["/donation-success", "settings"],
  ["/donation-cancel", "settings"],
  ["/payments/orders", "settings"],
  ["/embed/tutorial/:id", "embed"],
  ["/embed/class/:id", "embed"],
  ["/embed/event/:id", "embed"],
  ["/embed/course/:id", "embed"],
  ["/embed/test/:id", "embed"],
]);

/** Unmapped routes — no events are sent. */
export const UNMAPPED_ROUTES: ReadonlySet<string> = new Set(["/ecommerce/customers","/ecommerce/orders","/ecommerce/invoices","/ecommerce/shop","/ecommerce/shop-2","/ecommerce/product","/ecommerce/cart","/ecommerce/cart-2","/ecommerce/cart-3","/ecommerce/pay","/finance/cards","/finance/transactions","/finance/transaction-details","/job/job-listing","/job/job-post","/job/company-profile","/component/button","/component/form","/component/dropdown","/component/alert","/component/modal","/component/pagination","/component/tabs","/component/breadcrumb","/component/badge","/component/avatar","/component/tooltip","/component/accordion","/component/icons","/utility/changelog","/utility/roadmap","/utility/faqs","/utility/empty-state","/community/profile2","/community/users-tabs","/community/users-tiles","/community/feed2","/community/forum","/community/forum-post","/community/meetups","/community/meetups-post","/dashboard/analytics","/dashboard/fintech","/messages2","/inbox","/campaigns","/onboarding-01","/onboarding-02","/onboarding-03","/onboarding-04","/platform-config","/settings/account-old","/courses/cart/payment","/404","/not-found"]);

/** GTM Custom Event trigger regex for all client events. */
export const GTM_TRIGGER_REGEX = "^(page_view|navigation_click|search|view_search_results|select_content|role_select|sign_up_start|sign_up|email_verify|verification_email_resend|login|logout|auth_error|password_reset_request|invitation_view|invitation_accept|invitation_decline|post_invite_class_select|share|generate_lead|sign_up_prompt_click|limit_hit|upgrade_cta_click|content_block|exception|web_vitals|scroll_milestone|test_generate|test_start|test_resume|test_restart|question_answer|test_module_start|test_pause|test_complete|test_tool_use|question_mark_for_review|test_results_view|review_question_open|mistake_dismiss|study_plan_cta_click|vocab_session_start|vocab_session_end|score_calculator_use|goal_set|exam_category_select|study_plan_wizard_step|study_plan_generate|study_plan_generate_error|study_plan_open|study_session_start_click|study_plan_delete|task_create|task_status_change|subtask_complete|subtask_link_click|task_delete|progress_report_view|assignment_open|hub_card_click|home_cta_click|view_promotion|select_promotion|promotion_dismiss|ai_request|ai_output_copy|ai_history_open|view_item_list|select_item|view_item|catalog_filter_apply|video_start|video_progress|video_complete|tutorial_question_answer|tutorial_category_complete|course_lesson_complete|course_complete|course_review_submit|live_session_join|class_material_open|event_attend_toggle|content_favorite|event_invite_send|content_view|outbound_link_click|add_to_cart|remove_from_cart|view_cart|begin_checkout|checkout_session_error|checkout_return|course_enroll|coupon_apply|subscription_change|donation_open|student_work_view|student_plan_edit|test_assign|invitation_send|invitation_cancel|tutor_email_send|email_unsubscribe|content_create|content_update|content_publish|content_delete|class_material_add|session_note_create|session_note_share|availability_update|verification_call_book_click|tutor_insights_view|session_booking_open|session_slot_select|post_create|post_react|post_share|poll_vote|comment_post|comment_upvote|space_follow|conversation_start|message_send|notifications_dropdown_open|notification_open|notification_pref_change|support_chat_open|support_message_send|faq_open|feedback_submit|profile_update|connection_request_send|connection_respond|connection_remove)$";

