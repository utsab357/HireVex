"""
Certification Database — Normalized certification names with synonyms.
Used by resume_parser.py to detect and match certifications from resume text.

Format: canonical_name -> [list of text patterns that identify this cert]
"""

CERTIFICATION_DATABASE = {
    # Cloud — AWS
    'AWS Solutions Architect': [
        'aws solutions architect', 'aws certified solutions architect',
        'aws sa associate', 'aws sa professional',
    ],
    'AWS Developer': [
        'aws developer', 'aws certified developer',
    ],
    'AWS SysOps': [
        'aws sysops', 'aws certified sysops',
    ],
    'AWS DevOps Engineer': [
        'aws devops', 'aws certified devops',
    ],
    'AWS Cloud Practitioner': [
        'aws cloud practitioner', 'aws certified cloud practitioner', 'aws ccp',
    ],

    # Cloud — Azure
    'Azure Administrator': [
        'azure administrator', 'az-104', 'az104',
    ],
    'Azure Developer': [
        'azure developer', 'az-204', 'az204',
    ],
    'Azure Solutions Architect': [
        'azure solutions architect', 'az-305', 'az305',
    ],
    'Azure Fundamentals': [
        'azure fundamentals', 'az-900', 'az900',
    ],

    # Cloud — GCP
    'Google Cloud Professional': [
        'google cloud professional', 'gcp professional',
        'google cloud architect', 'gcp architect',
    ],
    'Google Cloud Associate': [
        'google cloud associate', 'gcp associate',
    ],

    # Project Management
    'PMP': [
        'pmp', 'project management professional',
    ],
    'PRINCE2': [
        'prince2', 'prince 2',
    ],

    # Agile / Scrum
    'Certified Scrum Master': [
        'csm', 'certified scrum master', 'scrum master certified',
    ],
    'Certified Scrum Product Owner': [
        'cspo', 'certified scrum product owner',
    ],
    'SAFe Agilist': [
        'safe agilist', 'safe certified', 'scaled agile',
    ],
    'PMI-ACP': [
        'pmi-acp', 'pmi acp', 'agile certified practitioner',
    ],

    # Security
    'CISSP': [
        'cissp', 'certified information systems security',
    ],
    'CEH': [
        'ceh', 'certified ethical hacker',
    ],
    'CompTIA Security+': [
        'security+', 'security plus', 'comptia security',
    ],
    'CompTIA Network+': [
        'network+', 'network plus', 'comptia network',
    ],
    'CompTIA A+': [
        'comptia a+', 'a+ certification', 'comptia a plus',
    ],
    'OSCP': [
        'oscp', 'offensive security certified',
    ],

    # Data & Analytics
    'Google Data Analytics': [
        'google data analytics', 'google data analytics certificate',
    ],
    'Tableau Certified': [
        'tableau certified', 'tableau desktop specialist',
    ],
    'Microsoft Power BI': [
        'power bi certified', 'pl-300', 'da-100',
    ],

    # DevOps & Containers
    'Certified Kubernetes Administrator': [
        'cka', 'certified kubernetes administrator',
    ],
    'Certified Kubernetes Developer': [
        'ckad', 'certified kubernetes application developer',
    ],
    'Docker Certified Associate': [
        'docker certified', 'dca',
    ],
    'Terraform Associate': [
        'terraform associate', 'hashicorp certified terraform',
    ],

    # Programming & Frameworks
    'Oracle Java Certified': [
        'oracle java certified', 'oracle certified java', 'ocjp', 'ocpjp',
        'java se certified', 'java certified programmer',
    ],
    'Microsoft Certified: .NET': [
        'microsoft certified .net', 'mcsd', 'azure developer .net',
    ],

    # Database
    'Oracle Database Certified': [
        'oracle certified dba', 'oracle database certified', 'oca', 'ocp database',
    ],
    'MongoDB Certified': [
        'mongodb certified', 'mongodb developer certified',
    ],

    # Networking
    'CCNA': [
        'ccna', 'cisco certified network associate',
    ],
    'CCNP': [
        'ccnp', 'cisco certified network professional',
    ],

    # ITIL / Service Management
    'ITIL Foundation': [
        'itil', 'itil foundation', 'itil v4', 'itil certified',
    ],

    # Six Sigma / Quality
    'Six Sigma Green Belt': [
        'six sigma green belt', 'green belt certified', 'lean six sigma green',
    ],
    'Six Sigma Black Belt': [
        'six sigma black belt', 'black belt certified', 'lean six sigma black',
    ],
}


def get_all_cert_patterns():
    """
    Returns a flat list of (pattern, canonical_name) tuples for matching.
    Sorted by pattern length descending so longer matches take priority.
    """
    patterns = []
    for canonical, synonyms in CERTIFICATION_DATABASE.items():
        for syn in synonyms:
            patterns.append((syn.lower(), canonical))

    # Sort by length descending — longer patterns match first (prevents partial matches)
    patterns.sort(key=lambda x: len(x[0]), reverse=True)
    return patterns
