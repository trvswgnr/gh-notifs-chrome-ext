/**
 * Thread
 */
type GhNotification = {
    id: string;
    last_read_at: null | string;
    reason: string;
    /**
     * Minimal Repository
     */
    repository: MinimalRepository;
    subject: Subject;
    subscription_url: string;
    unread: boolean;
    updated_at: string;
    url: string;
    [property: string]: any;
};

/**
 * Minimal Repository
 */
type MinimalRepository = {
    allow_forking?: boolean;
    archive_url: string;
    archived?: boolean;
    assignees_url: string;
    blobs_url: string;
    branches_url: string;
    clone_url?: string;
    /**
     * Code Of Conduct
     */
    code_of_conduct?: CodeOfConduct;
    collaborators_url: string;
    comments_url: string;
    commits_url: string;
    compare_url: string;
    contents_url: string;
    contributors_url: string;
    created_at?: Date | null;
    default_branch?: string;
    delete_branch_on_merge?: boolean;
    deployments_url: string;
    description: null | string;
    disabled?: boolean;
    downloads_url: string;
    events_url: string;
    fork: boolean;
    forks?: number;
    forks_count?: number;
    forks_url: string;
    full_name: string;
    git_commits_url: string;
    git_refs_url: string;
    git_tags_url: string;
    git_url?: string;
    has_discussions?: boolean;
    has_downloads?: boolean;
    has_issues?: boolean;
    has_pages?: boolean;
    has_projects?: boolean;
    has_wiki?: boolean;
    homepage?: null | string;
    hooks_url: string;
    html_url: string;
    id: number;
    is_template?: boolean;
    issue_comment_url: string;
    issue_events_url: string;
    issues_url: string;
    keys_url: string;
    labels_url: string;
    language?: null | string;
    languages_url: string;
    license?: null | License;
    merges_url: string;
    milestones_url: string;
    mirror_url?: null | string;
    name: string;
    network_count?: number;
    node_id: string;
    notifications_url: string;
    open_issues?: number;
    open_issues_count?: number;
    /**
     * A GitHub user.
     */
    owner: SimpleUser;
    permissions?: Permissions;
    private: boolean;
    pulls_url: string;
    pushed_at?: Date | null;
    releases_url: string;
    role_name?: string;
    security_and_analysis?: null | SecurityAndAnalysis;
    /**
     * The size of the repository, in kilobytes. Size is calculated hourly. When a repository is
     * initially created, the size is 0.
     */
    size?: number;
    ssh_url?: string;
    stargazers_count?: number;
    stargazers_url: string;
    statuses_url: string;
    subscribers_count?: number;
    subscribers_url: string;
    subscription_url: string;
    svn_url?: string;
    tags_url: string;
    teams_url: string;
    temp_clone_token?: string;
    topics?: string[];
    trees_url: string;
    updated_at?: Date | null;
    url: string;
    visibility?: string;
    watchers?: number;
    watchers_count?: number;
    web_commit_signoff_required?: boolean;
    [property: string]: any;
};

/**
 * Code Of Conduct
 */
type CodeOfConduct = {
    body?: string;
    html_url: null | string;
    key: string;
    name: string;
    url: string;
    [property: string]: any;
};

type License = {
    key?: string;
    name?: string;
    node_id?: string;
    spdx_id?: string;
    url?: string;
    [property: string]: any;
};

/**
 * A GitHub user.
 */
type SimpleUser = {
    avatar_url: string;
    email?: null | string;
    events_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    gravatar_id: null | string;
    html_url: string;
    id: number;
    login: string;
    name?: null | string;
    node_id: string;
    organizations_url: string;
    received_events_url: string;
    repos_url: string;
    site_admin: boolean;
    starred_at?: string;
    starred_url: string;
    subscriptions_url: string;
    type: string;
    url: string;
    [property: string]: any;
};

type Permissions = {
    admin?: boolean;
    maintain?: boolean;
    pull?: boolean;
    push?: boolean;
    triage?: boolean;
    [property: string]: any;
};

type SecurityAndAnalysis = {
    advanced_security?: AdvancedSecurity;
    /**
     * Enable or disable Dependabot security updates for the repository.
     */
    dependabot_security_updates?: DependabotSecurityUpdates;
    secret_scanning?: SecretScanning;
    secret_scanning_push_protection?: SecretScanningPushProtection;
    [property: string]: any;
};

type AdvancedSecurity = {
    status?: Status;
    [property: string]: any;
};

/**
 * The enablement status of Dependabot security updates for the repository.
 */
type Status = "enabled" | "disabled";

/**
 * Enable or disable Dependabot security updates for the repository.
 */
type DependabotSecurityUpdates = {
    /**
     * The enablement status of Dependabot security updates for the repository.
     */
    status?: Status;
    [property: string]: any;
};

type SecretScanning = {
    status?: Status;
    [property: string]: any;
};

type SecretScanningPushProtection = {
    status?: Status;
    [property: string]: any;
};

type Subject = {
    latest_comment_url: string;
    title: string;
    type: string;
    url: string;
    [property: string]: any;
};
