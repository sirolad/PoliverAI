const en = {
  reports: {
    title: 'Your Reports',
    no_reports_title: 'No reports yet 🙂',
    no_reports_message: 'Run an analysis to create your first report.',
    failed_open_report: 'Failed to open report',
    failed_download_report: 'Failed to download report',
    report: 'Report'
  },
  report_card: {
    select_aria: 'Select report {filename}',
    filename_label: 'filename:',
    size_label: 'Size:',
    full_label: 'Full',
    open: 'Open',
    view: 'View',
    download: 'Download'
  },
  filters: {
    show: 'Show Filters',
    hide: 'Hide Filters'
  },
  toolbar: {
    select_all: 'Select all',
    select_all_aria_all: 'Select all reports',
    select_all_aria_count: 'Select all {count} reports',
    results_loading: 'Loading...',
    results_with_total: '{visible} / {total} results',
    results: '{visible} results',
    per_page: 'Per page',
    prev: 'Prev',
    next: 'Next'
  },
  loading: {
    short: 'Loading…',
    reports: 'Loading reports…',
    reports_subtext: 'Refreshing the reports list — this may take a moment.'
  },
  bulk_delete: {
    deleted_title: 'Deleted {count} report(s)',
    failed: 'Failed to delete reports',
    partial: 'Partial delete'
  }
  ,
  errors: {
    bulk_delete_failed: 'Bulk delete failed'
  }
  ,
  navbar: {
    dashboard: 'Dashboard',
    analyze_policy: 'Analyze Policy',
    reports: 'Reports',
    transaction_history: 'Transaction History',
    upgrade_to_pro: 'Upgrade to Pro',
    buy_credits: 'Buy Credits',
    logout: 'Logout',
    login: 'Login',
    sign_up: 'Sign Up',
    open_user_menu: 'Open user menu',
    badge_pro: 'PRO',
    badge_free: 'FREE'
  },
  credits: {
    label: 'Credits:',
    unit: 'credits',
    
    transaction_history_title: 'Transaction History',
    hide_filters: 'Hide filters',
    show_filters: 'Show filters',
    subscription_credits: 'Subscription Credits',
    purchased_credits: 'Purchased Credits',
    total_spent: 'Total Spent',
    total_available: 'Total available: {total} credits',
    loading: 'Loading…',
    failed_to_load_transactions: 'Failed to load transactions',
    search_label: 'Search',
    search_placeholder: 'description, session id, email...',
    date_from: 'Date from',
    date_to: 'Date to',
    status_label: 'Status',
    clear: 'Clear',
    refresh: 'Refresh',
    loading_transactions_title: 'Loading transactions…',
    loading_transactions_subtext: 'This may take a moment — fetching your transaction history.',
    status_pending: 'Pending',
    status_success: 'Success',
    status_failed: 'Failed',
    status_insufficient: 'Insufficient Funds',
    failure: {
      card_declined: 'Card Declined',
      insufficient_funds: 'Insufficient Funds',
      lost_card: 'Lost Card',
      stolen_card: 'Stolen Card',
      expired_card: 'Expired Card',
      incorrect_cvc: 'Incorrect CVC',
      processing_error: 'Processing Error',
      incorrect_number: 'Incorrect Number',
      card_velocity_exceeded: 'Velocity Exceeded'
    }
    ,
    usd_amount: '${amount}',
    usd_equivalent: '${amount} USD equivalent',
    usd_spent: '${amount} USD spent'
  },
  payments: {
    failed: 'Payment failed'
  },
  payment_result: {
    close: 'Close'
  },
  payment_result_modal: {
    close: 'Close'
  },
  insufficient_credits: {
    default_title: 'Insufficient Credits',
    default_message: 'You do not have enough credits to perform this action. Top up your credits to continue.',
    close: 'Close',
    top_up: 'Top-Up Credits'
  },
  brand: {
    poliver: 'Poliver',
    ai: 'AI',
    alt: 'PoliverAI'
  }
  ,
  brand_block: {
    copyright: '© {year} PoliverAI ™. All rights reserved.',
    partnership: 'Designed in partnership with Andela',
    andela_alt: 'Andela'
  },
  team_carousel: {
    title: 'Meet the Team',
    subtitle: 'Building responsible AI tools to protect privacy and empower organizations.',
    aria_prev: 'previous',
    aria_next: 'next',
    members: {
      1: { title: 'Team Member 1', quote: 'When we teach machines to think, we must also teach them to care.' },
      2: { title: 'Team Member 2', quote: 'AI amplifies human creativity and helps us solve previously intractable problems.' },
      3: { title: 'Team Member 3', quote: 'Automation liberates humans to focus on what matters most.' },
      4: { title: 'Team Member 4', quote: 'Robust systems and compassionate design go hand in hand.' },
      5: { title: 'Team Member 5', quote: 'Open data and AI can build a fairer future for everyone.' },
      6: { title: 'Team Member 6', quote: 'AI must be built with empathy and a focus on human dignity.' },
      7: { title: 'Team Member 7', quote: 'Security and privacy are the foundations of trust in AI.' },
      8: { title: 'Team Member 8', quote: 'Efficient algorithms enable meaningful AI at scale.' },
      9: { title: 'Team Member 9', quote: 'Language is the bridge between human intent and machine understanding.' },
      10: { title: 'Team Member 10', quote: 'Innovation combines curiosity with disciplined engineering.' },
      11: { title: 'Team Member 11', quote: 'Quality assurance ensures reliability and user confidence.' },
      12: { title: 'Team Member 12', quote: 'Strong IT foundations make resilient products possible.' },
      13: { title: 'Team Member 13', quote: 'Inspiration drives teams to turn ideas into impact.' }
    }
  },
  reports_filters: {
    heading: 'Filters',
    clear: 'Clear filters',
    search_label: 'Search',
    search_placeholder: 'file name or title',
    verdict_status_label: 'Verdict / Status',
    option_all: 'All',
    option_compliance: 'Compliance Reports',
    option_full: 'Full Reports',
    date_range: 'Date range'
  },
  auth: {
    register: {
      join_title: 'Join PoliverAI',
      join_subtitle: 'Create your account and start ensuring GDPR compliance',
      create_account: 'Create Account',
      create_account_desc: 'Get started with your free PoliverAI account',
      name_label: 'Full Name',
      name_placeholder: 'Enter your full name',
      email_label: 'Email address',
      email_placeholder: 'Enter your email',
      password_label: 'Password',
      password_placeholder: 'Create a password',
      confirm_password_label: 'Confirm Password',
      confirm_password_placeholder: 'Confirm your password',
      terms_prefix: 'By creating an account, you agree to our',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      registration_failed: 'Registration failed',
      creating_account: 'Creating account...',
      create_account_cta: 'Create Account',
      already_have_account: "Already have an account?",
      sign_in: 'Sign in',
      validation_name_min: 'Name must be at least 2 characters',
      validation_email: 'Invalid email address',
      validation_password_min: 'Password must be at least 6 characters',
      validation_password_match: "Passwords don't match"
    }
  },
  auth_login: {
    welcome_title: 'Welcome back to PoliverAI',
    welcome_subtitle: 'Sign in to access your GDPR compliance dashboard',
    sign_in_title: 'Sign In',
    sign_in_desc: 'Enter your email and password to access your account',
    email_label: 'Email address',
    email_placeholder: 'Enter your email',
    password_label: 'Password',
    password_placeholder: 'Enter your password',
    signing_in: 'Signing in...',
    sign_in_cta: 'Sign In',
    no_account_prefix: "Don't have an account?",
    sign_up_cta: 'Sign up for free',
    login_failed: 'Login failed'
  },
  reports_bulk_actions: {
    refresh_title: 'Refresh reports',
    refresh: 'Refresh',
    delete_title: 'Delete selected reports',
    delete_selected: 'Delete Selected'
  },
  report_viewer: {
    title_report: 'Report',
    meta_line: 'Preview the generated report. You can save, download or delete it.',
    download: 'Download',
    save: 'Save',
    delete: 'Delete',
    close: 'Close',
    saving_report: 'Saving report…',
    loading_preview: 'Loading preview…',
    preview_not_available_title: 'Preview not available',
    preview_not_available_message: 'You can download the report using the Download button.',
    iframe_title: 'report-viewer'
  },
  enter_title_modal: {
    title: 'Save Report',
    subtitle: 'Enter a title that will appear in your Reports list',
    description: 'Enter a title for the report. This will be shown in your Reports list.',
    placeholder: 'Document title',
    option_html: 'Prettify (VIEW → PDF)',
    option_regular: 'Regular (PDF)',
    saving: 'Saving...',
    save: 'Save',
    close_aria: 'Close dialog'
  },
  enter_instructions_modal: {
    title: 'Revised Policy Instructions',
    subtitle: 'Optional guidance to customize how the policy is revised',
    description: 'Provide optional natural-language instructions to guide how the policy should be revised (tone, scope, sections to prioritize, etc.). Leave empty to use default guidance.',
    placeholder: 'E.g. keep language plain-English, focus on cookie consent section, use bullet lists',
    generating: 'Generating...',
    generate: 'Generate Revised Policy',
    close_aria: 'Close dialog'
  },
  enter_credits_modal: {
    title: 'Buy Credits',
    close_aria: 'Close dialog',
    description: 'Enter the amount in USD to purchase credits (1 USD = 10 credits)',
    meta: "We'll process your payment securely and add credits to your account.",
    processing: 'Processing...',
    buy: 'Buy'
  },
  confirm_delete_modal: {
    title: 'Confirm Delete',
    warning: 'This action cannot be undone.',
    question: 'Are you sure you want to delete {filename}? This action cannot be undone.',
    close: 'Close',
    delete: 'Delete',
    deleting: 'Deleting...'
  },
  confirm_bulk_delete_modal: {
    title_single: 'Confirm Delete',
    title_many: 'Confirm Bulk Delete',
    meta_single: 'Delete the selected report permanently.',
    meta_many: 'Delete the selected reports permanently.',
    question_single: 'Are you sure you want to delete the report {filename}? This action cannot be undone.',
    question_many: 'Are you sure you want to delete the following {count} reports? This action cannot be undone.',
    showing_first: 'Showing first {count} of {total}',
    close: 'Close'
  },
  landing: {
    hero: {
      prefix: 'Your',
      highlight: 'AI-Powered',
      suffix: 'GDPR Compliance Assistant',
      description: 'Automatically analyze privacy policies for GDPR compliance, detect violations, and generate comprehensive reports with AI-powered insights.'
    },
    buttons: {
      start_free: 'Start Free Analysis',
      processing: 'Processing...',
      upgrade_to_pro: 'Upgrade to Pro',
      go_dashboard: 'Go to Dashboard',
      get_started_free: 'Get Started Free',
      upgrade_cta: 'Upgrade to Pro',
      start_free_cta: 'Start Your Free Analysis Today'
    },
    partner: {
      prefix: 'An',
      alt: 'Andela',
      suffix: 'initiative — designed in partnership with Andela'
    },
    features: {
      title: 'Powerful Features for Every Need',
      subtitle: 'From basic compliance checks to advanced AI-powered analysis',
      free_heading: 'Free Tier Features',
      pro_heading: 'Pro Tier Features'
    },
    how: {
      title: 'How PoliverAI Works',
      subtitle: 'Simple, powerful, and intelligent GDPR compliance analysis',
      step1_title: 'Upload Your Policy',
      step1_desc: 'Upload privacy policies in multiple formats (PDF, DOCX, TXT, HTML)',
      step2_title: 'AI Analysis',
      step2_desc: 'Our AI analyzes your policy against GDPR requirements with multiple analysis modes',
      step3_title: 'Get Results',
      step3_desc: 'Receive detailed reports with compliance scores, violations, and actionable recommendations'
  },
    pricing: {
      title: 'Choose Your Plan',
      subtitle: 'Start with our free tier or upgrade for advanced AI features',
      free_title: 'Free Tier',
      free_price: '$0',
      free_desc: 'Perfect for getting started',
      pro_title: 'Pro Tier',
      pro_price: '$29',
      pro_period: 'per month',
      popular: 'POPULAR'
    },
    cta: {
      heading: 'Ready to Ensure GDPR Compliance?',
      paragraph: 'Join thousands of organizations using PoliverAI to maintain privacy compliance'
    },
    team: {
      heading: 'Why We Love Building Poliver AI',
      paragraph: "Our team takes great pride in building PoliverAI. We collaborate openly, learn from each other, and bring curiosity to solve privacy challenges that matter. Every feature is crafted with care — to make compliance easier, more reliable, and human-centered. Working together on this project isn't just a job for us — it's a shared passion, and we hope that energy comes through for our users."
    }
  },
  labels: {
    pro: 'PRO'
  }
  ,
  app_platforms: {
    heading: 'Built for every device',
    subheading: "We've got you covered no matter your device type or operating system.",
    download_app: 'Download App',
    downloading: 'Downloading…',
    downloads_label: 'Downloads',
    downloads_so_far: 'so far',
    free_reports: 'Free Reports',
    full_reports: 'Full Reports',
    ai_revised_policies: 'AI Revised Policies',
    reports_label: 'Reports',
    policies_label: 'Policies',
    users_label: 'Users',
    subs_label: 'Subs',
    and_counting: 'and counting',
    sign_ups: 'Sign Ups'
    ,
    platforms: {
      android: 'Android',
      ios: 'iOS',
      windows: 'Windows',
      macos: 'macOS',
      linux: 'Linux'
    }
  }
  ,
  footer: {
    short: 'Fast, simple GDPR compliance checks',
    paragraph: 'A quick, reliable privacy policy analysis — get results fast and act with confidence.'
  }
  ,
  pricing: {
    heading: 'Pricing',
    get_started_free: 'Get Started Free',
    popular: 'Popular',
    upgrade: 'Upgrade'
  }
  ,
  how: {
    title: 'How PoliverAI Works',
    subtitle: 'Simple, powerful, and intelligent GDPR compliance analysis'
  }
  ,
  sidebar: {
    article: 'Article {num}:'
  }
  ,
  finding_card: {
    article: 'Article {num}',
    confidence: 'Confidence: {pct}%'
  },
  dashboard: {
    loading: 'Loading your dashboard…',
    welcome: 'Welcome back, {name}!',
    subtitle: 'Manage your GDPR compliance analysis and reports from your dashboard.',
    account_status: {
      title: 'Account Status',
      on_plan_pro: 'You are currently on the Pro plan',
      on_plan_free: 'You are currently on the Free plan',
      badge_pro: 'PRO PLAN',
      badge_free: 'FREE PLAN',
      unlock_heading: 'Unlock Premium Features',
      unlock_paragraph: 'Get AI-powered deep analysis, comprehensive reporting, and policy generation with our Pro plan starting at $29/month.',
      learn_more: 'Learn More',
      upgrade_button: 'Upgrade to Pro',
      refresh: 'Refresh'
      ,
      upgrade_success_title: 'Upgrade Successful',
      upgrade_success_message: 'Your account is now PRO'
    },
    credits: {
      heading: 'How credits are used:',
      explanation: 'Subscription credits are consumed first and each subscription credit covers approx ~1.5x of a regular credit (discounted). If subscription credits run out, the system falls back to purchased credits which are charged at a slightly higher rate (penalty ~1.25x).',
      subscription_expires: 'Subscription expires: {date}'
    },
    saved_files: {
      title: 'Saved Files',
      total_files_saved: 'Total files saved',
      total_full_reports_saved: 'Total full reports saved',
      total_free_reports_saved: 'Total free reports saved',
      estimated_cost: 'Estimated cost:'
    },
    deleted_files: {
      title: 'Deleted Files',
      deleted_full: 'Deleted full reports',
      deleted_revision: 'Deleted revised policies',
      deleted_free: 'Deleted free reports',
      deleted_total: 'Total deleted files',
      how_to_limit: 'How limit results by date:'
      ,
      how_to_limit_explain: 'Use the "Saved Files" date picker at the top of this card to narrow the Saved Files and Deleted Files counts to a specific range. The dashboard filters deletion events recorded in this browser. If no per-event data is available (older installs), the dashboard falls back to legacy all-time totals stored locally.'
    },
    completed_reports: {
      title: 'Completed Reports',
      full_reports_completed: 'Full reports completed',
      revised_policies_completed: 'Revised policies completed',
      free_reports_completed: 'Free reports completed',
      cost_per_free: 'Cost per free report: {cost} credits'
    },
    transactions: {
      title: 'Transaction Status',
      total_bought: 'Total credits bought',
      total_spent: 'Total credits spent'
    },
    quick_actions: 'Quick Actions',
    analyze_new_policy: {
      title: 'Analyze New Policy',
      desc: 'Upload a privacy policy for GDPR compliance analysis'
    },
    view_reports: {
      title: 'View Reports',
      desc: 'Access your detailed compliance reports and history'
    },
    features: {
      title: 'Your Features',
      free_heading: 'Free Tier Features',
      pro_heading: 'Pro Plan Features',
      free: {
        policy_verification: {
          title: 'Policy Verification',
          desc: 'Upload and analyze privacy policies with basic GDPR compliance checks'
        },
        fast_analysis: {
          title: 'Fast Analysis',
          desc: 'Quick rule-based compliance screening'
        },
        basic_recommendations: {
          title: 'Basic Recommendations',
          desc: 'Get essential compliance improvement suggestions'
        }
      },
      pro: {
        ai_analysis: {
          title: 'AI-Powered Analysis',
          desc: 'Advanced AI analysis with nuanced violation detection'
        },
        reports: {
          title: 'Comprehensive Reports',
          desc: 'Detailed PDF reports with confidence scores and evidence'
        },
        policy_generation: {
          title: 'Policy Generation',
          desc: 'Automatically generate revised compliant policies'
        }
      }
    },
    getting_started: {
      title: 'Getting Started',
      description: "New to PoliverAI? Here's how to get the most out of your account",
      steps: {
        upload: {
          title: 'Upload Your First Policy',
          desc: 'Start by uploading a privacy policy document to analyze for GDPR compliance'
        },
        review: {
          title: 'Review Analysis Results',
          desc: 'Examine compliance scores, violations, and recommendations for improvement'
        },
        generate_or_upgrade: {
          pro_title: 'Generate Reports',
          free_title: 'Consider Upgrading',
          pro_desc: 'Create detailed compliance reports and generate revised policies',
          free_desc: 'Upgrade to Pro for advanced AI analysis and comprehensive reporting'
        }
      }
    }
  }
  ,
  policy_analysis: {
    title: 'Policy Analysis',
    not_authenticated_title: 'Not Authenticated',
    not_authenticated_message: 'Please login to analyze policies.',
    upload_label: 'Upload policy',
    upload_hint: 'Drag & drop a policy file here, or click to browse',
    upload_supports: 'Supports PDF, DOCX, HTML, TXT',
    browse_files: 'Browse files',
    remove: 'Remove',
    selected_file: 'Selected file',
    analyze: 'Analyze',
    summary_heading: 'Summary',
    no_result_yet: 'No result yet',
    findings_heading: 'Findings ({count})',
    no_findings: 'No findings',
    reset: 'Reset',
    full_report_cta: 'Full Report',
    save: 'Save',
    revised_policy_cta: 'Revised Policy',
    work_in_progress: 'Work In Progress',
    header_subtitle: 'Result Broken Down / Report Preview',
    analyzing: 'Analyzing...',
    free_tab: 'Free',
    full_tab: 'Full',
    revised_tab: 'Revised',
    header_free: 'Free Analysis Result',
    header_full: 'Full Analysis Result',
    header_revised: 'Revised Policy Result',
    no_analysis_yet_title: 'No analysis yet',
    no_analysis_yet_desc: 'Upload a policy file and click Analyze to run a quick analysis.',
    no_findings_detected: 'No findings detected.',
    top_findings: 'Top Findings',
  top_controls: {
    title: 'Policy analysis',
    subtitle: 'Review and generate reports for uploaded policies.',
    summary: 'Summary: {verdict} — score {score}',
    how_it_works: 'How it works',
    reset: 'Reset',
    save_report: 'Save report'
  },
  result_summary_compact: '{verdict} • Score {score}',
  verdict_label: 'Verdict',
  confidence_label: 'Confidence: {pct}%',
  score_label: 'Score',
  metrics_total_violations: 'Total Violations:',
  metrics_requirements_met: 'Requirements Met:',
  metrics_critical_violations: 'Critical Violations:',
  markdown_score: '**Score:** {score}%',
  markdown_confidence: '**Confidence:** {pct}%\n\n',
  no_recommendations: 'No recommendations',
  evidence_heading: 'Evidence',
  no_evidence_excerpts: 'No evidence excerpts',
    full_report_not_generated_title: 'Full report not generated',
    full_report_not_generated_desc: 'Click the Full Report button above to generate a persisted, detailed report.',
    generate_full_report_cta: 'Generate Full Report',
  generating_full_report: 'Generating Full Report...',
    download_file: 'Download File',
    generated_label: 'Generated:',
    no_report_generated_yet: 'No report generated yet',
    loading_report: 'Loading report…',
    revised_policy_preview: 'Revised policy (preview)',
    nothing_here_generate: 'Nothing is here — generate a Revised Policy first',
    nothing_here_desc: 'Click the Revised Policy button above to ask the AI to generate a revised policy and save it.',
    loaded: 'Loaded',
    failed_to_load_report: 'Failed to load report',
    full_report_generated: 'Full Report Generated',
    revised_policy_generated: 'Revised Policy Generated',
    saved: 'Saved',
    save_failed: 'Save failed',
    generate_failed: 'Generate failed',
    revision_failed: 'Revision failed'
  }
}

export default en
