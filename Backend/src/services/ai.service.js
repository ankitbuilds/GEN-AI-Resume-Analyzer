const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const PDFDocument = require("pdfkit")


const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportSchema = z.object({
    matchScore: z.number().describe("Match score 0-100"),

    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),

    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),

    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"]),
    })),

    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string())
    }))
})

function generateDynamicMockData(jobDescription, selfDescription) {
    // Extract keywords from job description
    const jobLower = jobDescription.toLowerCase();
    const selfLower = selfDescription.toLowerCase();
    
    // Tech roles detection
    const hasReact = /react|vue|angular|frontend/.test(jobLower);
    const hasNode = /node|express|backend|server/.test(jobLower);
    const hasMongoDb = /mongodb|mongo|nosql|database/.test(jobLower);
    const hasPython = /python|django|flask/.test(jobLower);
    const hasJava = /java(?!script)/.test(jobLower);
    const hasDocker = /docker|container|kubernetes/.test(jobLower);
    const hasAWS = /aws|azure|gcp|cloud|devops/.test(jobLower);
    const hasSQL = /sql|postgres|mysql|relational/.test(jobLower);
    const hasTypeScript = /typescript|ts/.test(jobLower);
    const hasGraphQL = /graphql/.test(jobLower);
    
    // Non-tech roles detection
    const isPM = /product manager|pm\b|product management/.test(jobLower);
    const isProjectMgr = /project manager|project management/.test(jobLower);
    const isSales = /sales|business development|account executive/.test(jobLower);
    const isMarketing = /marketing|growth|content|brand/.test(jobLower);
    const isDesign = /ux|ui|design|designer|product design/.test(jobLower);
    const isHR = /hr|human resources|recruiter|talent/.test(jobLower);
    const isManagement = /manager|director|leadership|executive/.test(jobLower);
    const isAnalyst = /analyst|business analyst|data analyst/.test(jobLower);
    
    // Determine if it's a tech or non-tech role
    const isTechRole = hasReact || hasNode || hasMongoDb || hasPython || hasJava || hasDocker || hasAWS || hasSQL;
    const isNonTechRole = isPM || isProjectMgr || isSales || isMarketing || isDesign || isHR || isManagement || isAnalyst;
    
    // Calculate match score based on experience
    const yearsMatch = selfDescription.match(/(\d+)\s*years?/i);
    const candidateYears = yearsMatch ? parseInt(yearsMatch[1]) : 0;
    let matchScore = 60;
    if (candidateYears >= 5) matchScore = 80 + Math.random() * 10;
    else if (candidateYears >= 3) matchScore = 70 + Math.random() * 15;
    else if (candidateYears >= 1) matchScore = 60 + Math.random() * 20;
    else matchScore = 50 + Math.random() * 15;
    
    // Question pools for tech roles
    const techQuestionPool = {
        react: [
            {
                question: "Explain React hooks and how useEffect differs from lifecycle methods",
                intention: "Assess React fundamentals knowledge",
                answer: "Hooks allow functional components to use state and lifecycle. useEffect replaces componentDidMount, componentDidUpdate, and componentWillUnmount. It runs after render and supports cleanup functions."
            },
            {
                question: "How does React's virtual DOM improve performance?",
                intention: "Test understanding of reconciliation",
                answer: "React maintains a virtual DOM in memory. On state changes, React compares virtual and real DOM, identifying differences and updating only necessary parts, avoiding expensive full re-renders."
            },
            {
                question: "What are controlled and uncontrolled components?",
                intention: "Assess form handling knowledge",
                answer: "Controlled components have their state managed by React via onChange handlers. Uncontrolled components manage their own state via refs. Use controlled for predictable behavior."
            }
        ],
        node: [
            {
                question: "How does Node.js event loop work and handle asynchronous operations?",
                intention: "Test understanding of Node.js concurrency",
                answer: "Node.js uses a single-threaded event loop with phases: timers, pending, idle/prepare, poll, check, close. I/O operations use libuv for non-blocking execution."
            },
            {
                question: "Explain middleware in Express.js",
                intention: "Assess Express knowledge",
                answer: "Middleware are functions that process requests/responses in order. They can modify req/res objects, end the request cycle, or pass control to next middleware using next()."
            },
            {
                question: "What are streams in Node.js?",
                intention: "Test knowledge of data handling",
                answer: "Streams process large amounts of data in chunks. They're memory-efficient and can be piped together. Types include readable, writable, duplex, and transform streams."
            }
        ],
        mongodb: [
            {
                question: "Explain document embedding vs referencing in MongoDB",
                intention: "Assess data modeling knowledge",
                answer: "Embedding stores related data in a single document for faster reads. Referencing uses separate collections with foreign keys to avoid duplication. Choose based on query patterns."
            },
            {
                question: "What are MongoDB indexes and how do they impact performance?",
                intention: "Test optimization knowledge",
                answer: "Indexes speed up queries by creating sorted data structures. They trade write performance for read speed. Use explain() to analyze query performance."
            },
            {
                question: "How do you handle transactions in MongoDB?",
                intention: "Assess ACID knowledge",
                answer: "Multi-document transactions were added in version 4.0. They ensure atomicity across multiple documents. Use sessions to group operations."
            }
        ],
        python: [
            {
                question: "Explain Python decorators and their use cases",
                intention: "Assess Python advanced features",
                answer: "Decorators are functions that modify other functions/classes. They use the @ syntax. Common uses: authentication, logging, caching, validation."
            },
            {
                question: "What are list comprehensions and generators?",
                intention: "Test Python idioms",
                answer: "List comprehensions create lists concisely: [x for x in range(10)]. Generators use yield and create iterators lazily, saving memory for large datasets."
            },
            {
                question: "Explain async/await in Python",
                intention: "Assess asynchronous programming",
                answer: "async/await enables concurrent execution. async defines coroutines, await pauses execution until awaited coroutine completes. Use with asyncio for non-blocking I/O."
            }
        ],
        docker: [
            {
                question: "Explain Docker container lifecycle and layers",
                intention: "Test containerization knowledge",
                answer: "Containers go through: create â†’ start â†’ run â†’ stop â†’ remove. Each instruction in Dockerfile creates a layer. Layers are cached for faster builds."
            },
            {
                question: "What's the difference between volumes and bind mounts?",
                intention: "Assess data persistence knowledge",
                answer: "Volumes are managed by Docker and persist data. Bind mounts connect host directories directly. Volumes are preferred for production."
            },
            {
                question: "How do you optimize Docker images?",
                intention: "Test best practices",
                answer: "Use multi-stage builds to reduce image size. Order Dockerfile instructions from least to most frequently changed. Use .dockerignore to exclude files."
            }
        ],
        aws: [
            {
                question: "Design a scalable web application architecture on AWS",
                intention: "Assess cloud architecture",
                answer: "Use ELB for load balancing, Auto Scaling for elasticity, RDS/DynamoDB for data, S3 for storage, CloudFront for CDN, Route53 for DNS."
            },
            {
                question: "What are Lambda functions and when to use them?",
                intention: "Test serverless knowledge",
                answer: "Lambda runs code without managing servers. Use for: API backends, data processing, scheduled tasks, real-time file processing. Pay only for execution time."
            },
            {
                question: "Explain VPC, subnets, and security groups",
                intention: "Assess network knowledge",
                answer: "VPC is your isolated network. Subnets divide VPC into smaller networks. Security groups are virtual firewalls controlling inbound/outbound traffic."
            }
        ],
        sql: [
            {
                question: "Explain JOINs and their different types",
                intention: "Test SQL fundamentals",
                answer: "INNER JOIN returns matching records. LEFT JOIN includes unmatched left records. RIGHT/FULL JOINs work similarly. Use for combining data from multiple tables."
            },
            {
                question: "What are indexes and how do they affect query performance?",
                intention: "Assess optimization",
                answer: "Indexes speed up SELECT and WHERE clauses but slow INSERT/UPDATE. Use on frequently queried columns. Composite indexes help multi-column queries."
            },
            {
                question: "Explain ACID properties in databases",
                intention: "Test transaction knowledge",
                answer: "Atomicity: all or nothing. Consistency: valid state maintained. Isolation: concurrent transactions don't interfere. Durability: committed data persists."
            }
        ],
        typescript: [
            {
                question: "What are generics in TypeScript?",
                intention: "Assess advanced TypeScript",
                answer: "Generics provide reusable components with type safety. Use <T> syntax to create type-agnostic functions/classes. Enable type inference while maintaining flexibility."
            },
            {
                question: "Explain interfaces vs types in TypeScript",
                intention: "Test TypeScript concepts",
                answer: "Interfaces define object structures and can extend other interfaces. Types can represent primitives, unions, and tuples. Use interfaces for OOP, types for functional patterns."
            }
        ],
        java: [
            {
                question: "Explain the difference between inheritance and composition in Java",
                intention: "Assess OOP principles",
                answer: "Inheritance creates 'is-a' relationships through class hierarchy. Composition creates 'has-a' relationships by including objects. Prefer composition for flexibility."
            },
            {
                question: "What are Java streams and how do you use them?",
                intention: "Test functional programming knowledge",
                answer: "Streams process collections functionally using map, filter, reduce. They're lazy-evaluated and support parallel processing. Use for transformations."
            },
            {
                question: "Explain garbage collection in Java",
                intention: "Assess memory management",
                answer: "GC automatically reclaims unreachable objects. Different algorithms: generational, mark-sweep, G1GC. Understand pauses and tuning for performance."
            }
        ],
        graphql: [
            {
                question: "How is GraphQL different from REST APIs?",
                intention: "Test API design knowledge",
                answer: "GraphQL clients request exactly the fields needed, avoiding over/under-fetching. Single endpoint, strongly typed schema, real-time subscriptions supported."
            },
            {
                question: "Explain resolvers in GraphQL and how they work",
                intention: "Assess implementation knowledge",
                answer: "Resolvers are functions that return data for each field. They can fetch from various sources and can be nested. Support batching and caching."
            },
            {
                question: "How do you handle authentication and authorization in GraphQL?",
                intention: "Test security knowledge",
                answer: "Validate tokens in middleware or directives. Use schema directives for field-level authorization. Implement permission checks in resolvers."
            }
        ]
    };
    
    // Question pools for non-tech roles
    const nonTechQuestionPool = {
        pm: [
            {
                question: "Walk through your approach to defining and communicating product vision",
                intention: "Assess strategic thinking and communication",
                answer: "Understand user needs through research, define clear vision aligned with business goals, articulate it simply across teams, iterate based on feedback."
            },
            {
                question: "How do you prioritize features and manage the product roadmap?",
                intention: "Test prioritization framework",
                answer: "Use frameworks like RICE (Reach, Impact, Confidence, Effort). Balance user needs, business value, and technical feasibility. Communicate trade-offs transparently."
            },
            {
                question: "Describe your experience working with design and engineering teams",
                intention: "Assess cross-functional collaboration",
                answer: "Facilitate alignment through regular syncs, respect expertise, involve teams in decisions, provide clear requirements, remove blockers, celebrate wins together."
            }
        ],
        projectMgr: [
            {
                question: "How do you manage scope, schedule, and resources on a project?",
                intention: "Assess project management fundamentals",
                answer: "Define scope clearly upfront, use realistic estimates, track progress with milestones, manage risks proactively, communicate status regularly, adjust as needed."
            },
            {
                question: "Tell me about a time you dealt with a difficult stakeholder",
                intention: "Test stakeholder management",
                answer: "Listen to their concerns, establish common goals, provide transparent communication, involve them in decisions, manage expectations, build trust."
            },
            {
                question: "How do you keep a project on track when unexpected issues arise?",
                intention: "Assess problem-solving",
                answer: "Identify impact quickly, reassess timeline, communicate changes, explore mitigation options, document lessons learned, prevent recurrence."
            }
        ],
        sales: [
            {
                question: "Walk me through your sales process and how you build relationships",
                intention: "Assess sales methodology",
                answer: "Research prospect, establish rapport, understand pain points, present relevant solution, handle objections, follow up consistently, deliver value beyond sale."
            },
            {
                question: "How do you handle rejection and stay motivated?",
                intention: "Test resilience",
                answer: "View rejection as feedback, analyze why deal didn't close, iterate approach, focus on pipeline, celebrate wins, support teammates, maintain positive attitude."
            },
            {
                question: "Describe your experience exceeding sales targets",
                intention: "Assess achievement",
                answer: "Share specific numbers and achievements, explain strategies used, highlight key relationships, demonstrate market knowledge, show continuous improvement."
            }
        ],
        marketing: [
            {
                question: "How do you approach developing a marketing strategy for a product?",
                intention: "Assess strategic thinking",
                answer: "Understand target audience deeply, analyze competitive landscape, identify unique value proposition, choose appropriate channels, set measurable goals, test and iterate."
            },
            {
                question: "Tell me about a successful campaign you led",
                intention: "Test execution",
                answer: "Describe the brief and objectives, explain your approach, detail execution, share metrics and ROI, highlight learnings, show impact on business."
            },
            {
                question: "How do you measure marketing effectiveness?",
                intention: "Assess analytics mindset",
                answer: "Define KPIs before campaign, track multiple metrics (impression, click, conversion, retention), use A/B testing, analyze data regularly, optimize based on insights."
            }
        ],
        design: [
            {
                question: "Walk me through your design process from concept to delivery",
                intention: "Assess design methodology",
                answer: "Research and understand problem, sketch ideas, create wireframes, iterate with feedback, develop high-fidelity designs, test with users, refine and handoff."
            },
            {
                question: "How do you balance user needs with business requirements?",
                intention: "Test stakeholder balance",
                answer: "Conduct user research to validate needs, understand business goals, find overlaps where possible, propose trade-offs with reasoning, test assumptions with users."
            },
            {
                question: "Tell me about your experience with design systems and collaboration with developers",
                intention: "Assess systems thinking",
                answer: "Create design systems for consistency, document components and patterns, provide clear specs and assets, collaborate early with engineering, support handoff process."
            }
        ],
        hr: [
            {
                question: "How do you approach recruiting and building diverse teams?",
                intention: "Assess talent acquisition",
                answer: "Create inclusive job descriptions, use diverse sourcing channels, structure interviews fairly, evaluate for potential and culture fit, remove bias, build belonging."
            },
            {
                question: "Describe your experience with employee development and retention",
                intention: "Test people leadership",
                answer: "Provide regular feedback, create development plans, offer learning opportunities, recognize achievements, address concerns early, foster growth mindset."
            },
            {
                question: "How do you handle a sensitive employee relations issue?",
                intention: "Assess judgment and discretion",
                answer: "Listen to all parties, investigate thoroughly, apply policies consistently, document carefully, involve legal if needed, maintain confidentiality, follow through."
            }
        ],
        analyst: [
            {
                question: "Walk me through your approach to analyzing a complex business problem",
                intention: "Assess analytical thinking",
                answer: "Define the problem clearly, gather relevant data, explore multiple hypotheses, use appropriate analysis methods, visualize findings, draw actionable insights, present clearly."
            },
            {
                question: "How do you ensure data quality and accuracy in your analysis?",
                intention: "Test attention to detail",
                answer: "Validate data sources, check for outliers and errors, document assumptions, use appropriate statistical methods, peer review, version control, maintain audit trails."
            },
            {
                question: "Tell me about a data-driven decision that impacted business",
                intention: "Assess business impact",
                answer: "Describe the business question, explain data analysis, present findings clearly, recommend actions, show business impact with metrics, share learnings."
            }
        ],
        management: [
            {
                question: "How do you lead and motivate your team towards goals?",
                intention: "Assess leadership and motivation",
                answer: "Set clear vision and goals, provide regular feedback, recognize achievements, create psychological safety, delegate effectively, develop people, model desired behaviors."
            },
            {
                question: "Describe your approach to strategic planning and execution",
                intention: "Test strategic thinking",
                answer: "Align with company goals, involve team in planning, set measurable objectives, monitor progress, adapt to changes, communicate status, celebrate wins."
            },
            {
                question: "How do you handle underperformance or difficult team members?",
                intention: "Assess people management",
                answer: "Identify root causes, have honest conversations, set clear expectations and support, document performance, provide development opportunities, escalate if needed."
            }
        ]
    };
    
    // Select relevant questions based on role type
    const selectedQuestions = [];
    
    if (isNonTechRole) {
        // Non-tech role questions
        if (isPM) selectedQuestions.push(...(nonTechQuestionPool.pm || []));
        if (isProjectMgr) selectedQuestions.push(...(nonTechQuestionPool.projectMgr || []));
        if (isSales) selectedQuestions.push(...(nonTechQuestionPool.sales || []));
        if (isMarketing) selectedQuestions.push(...(nonTechQuestionPool.marketing || []));
        if (isDesign) selectedQuestions.push(...(nonTechQuestionPool.design || []));
        if (isHR) selectedQuestions.push(...(nonTechQuestionPool.hr || []));
        if (isAnalyst) selectedQuestions.push(...(nonTechQuestionPool.analyst || []));
        if (isManagement) selectedQuestions.push(...(nonTechQuestionPool.management || []));
    } else {
        // Tech role questions
        if (hasReact) selectedQuestions.push(...(techQuestionPool.react || []));
        if (hasNode) selectedQuestions.push(...(techQuestionPool.node || []));
        if (hasMongoDb) selectedQuestions.push(...(techQuestionPool.mongodb || []));
        if (hasPython) selectedQuestions.push(...(techQuestionPool.python || []));
        if (hasJava) selectedQuestions.push(...(techQuestionPool.java || []));
        if (hasDocker) selectedQuestions.push(...(techQuestionPool.docker || []));
        if (hasAWS) selectedQuestions.push(...(techQuestionPool.aws || []));
        if (hasSQL) selectedQuestions.push(...(techQuestionPool.sql || []));
        if (hasTypeScript) selectedQuestions.push(...(techQuestionPool.typescript || []));
        if (hasGraphQL) selectedQuestions.push(...(techQuestionPool.graphql || []));
    }
    
    // Fill remaining slots with generic questions if needed
    const genericQuestions = [
        {
            question: "Describe your experience with debugging and troubleshooting",
            intention: "Assess problem-solving skills",
            answer: "Use systematic approaches. Isolate variables, reproduce issues, check edge cases. Follow a structured methodology and document findings."
        },
        {
            question: "How do you approach learning and staying current in your field?",
            intention: "Test continuous learning",
            answer: "Read industry resources, take courses, experiment with new tools, mentor others, attend conferences, contribute to communities, reflect on learnings."
        },
        {
            question: "Tell me about a time you failed and what you learned",
            intention: "Assess growth mindset",
            answer: "Choose real example, explain what happened, take accountability, describe impact, share what you learned, show how you improved."
        },
        {
            question: "How do you prioritize when you have multiple competing demands?",
            intention: "Test prioritization",
            answer: "Clarify goals and deadlines, assess impact and effort, communicate trade-offs, get help when needed, focus on high-value work first."
        },
        {
            question: "Describe your experience working across different teams or departments",
            intention: "Assess collaboration",
            answer: "Build relationships, understand different perspectives, find common ground, communicate clearly, deliver on commitments, resolve conflicts professionally."
        }
    ];
    
    while (selectedQuestions.length < 5) {
        const randomIndex = Math.floor(Math.random() * genericQuestions.length);
        selectedQuestions.push(genericQuestions[randomIndex]);
    }
    
    // Shuffle and take first 5
    const technicalQuestions = selectedQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);
    
    // Behavioral questions
    const behavioralQuestions = [
        {
            question: "Tell me about your greatest professional achievement",
            intention: "Assess accomplishment and pride",
            answer: "Choose significant project, explain your role, describe challenges, quantify impact if possible."
        },
        {
            question: "How do you approach learning new skills and knowledge?",
            intention: "Test learning ability",
            answer: "Documentation, tutorials, small projects, open source contribution, consistent practice, hands-on experimentation."
        },
        {
            question: "Describe a conflict with a colleague and how you resolved it",
            intention: "Assess collaboration",
            answer: "Listen actively, focus on facts not personalities, find common ground, document agreements, follow up on resolution."
        },
        {
            question: "How do you handle pressure and tight deadlines?",
            intention: "Test stress management",
            answer: "Prioritize ruthlessly, communicate proactively, break tasks into chunks, maintain quality, ask for help when needed."
        },
        {
            question: "What attracted you to this role and company?",
            intention: "Assess motivation and fit",
            answer: "Research company mission, align with personal goals, mention specific aspects, show genuine enthusiasm."
        }
    ];
    
    // Generate skill gaps based on detected role
    const skillGaps = [];
    
    if (isNonTechRole) {
        // Non-tech skill gaps
        if (isPM) {
            skillGaps.push({ skill: "Data analysis and metrics", severity: "medium" });
            skillGaps.push({ skill: "Technical literacy", severity: "medium" });
            skillGaps.push({ skill: "User research methods", severity: "low" });
        }
        if (isSales) {
            skillGaps.push({ skill: "Product knowledge", severity: "medium" });
            skillGaps.push({ skill: "CRM platform expertise", severity: "low" });
        }
        if (isMarketing) {
            skillGaps.push({ skill: "Marketing automation tools", severity: "medium" });
            skillGaps.push({ skill: "Analytics platforms", severity: "medium" });
        }
        if (isDesign) {
            skillGaps.push({ skill: "Prototyping tools mastery", severity: "low" });
            skillGaps.push({ skill: "User research", severity: "medium" });
        }
        if (isHR) {
            skillGaps.push({ skill: "Employment law knowledge", severity: "medium" });
            skillGaps.push({ skill: "HRIS systems", severity: "low" });
        }
        if (isAnalyst) {
            skillGaps.push({ skill: "SQL and database queries", severity: "medium" });
            skillGaps.push({ skill: "Advanced analytics tools", severity: "medium" });
        }
        if (isManagement) {
            skillGaps.push({ skill: "Strategic planning and execution", severity: "medium" });
            skillGaps.push({ skill: "Budget and resource management", severity: "medium" });
            skillGaps.push({ skill: "Coaching and mentoring", severity: "low" });
        }
        skillGaps.push({ skill: "Communication and presentation", severity: "low" });
    } else {
        // Tech skill gaps
        if (hasDocker && !selfLower.includes('docker')) {
            skillGaps.push({ skill: "Docker containerization", severity: "high" });
        }
        if (hasAWS && !selfLower.includes('aws') && !selfLower.includes('cloud')) {
            skillGaps.push({ skill: "AWS cloud services", severity: "high" });
        }
        if (hasGraphQL && !selfLower.includes('graphql')) {
            skillGaps.push({ skill: "GraphQL API design", severity: "medium" });
        }
        if (hasTypeScript && !selfLower.includes('typescript')) {
            skillGaps.push({ skill: "TypeScript", severity: "medium" });
        }
        skillGaps.push({ skill: "System design and scalability", severity: "medium" });
        if (skillGaps.length < 4) {
            skillGaps.push({ skill: "Performance optimization", severity: "low" });
        }
    }
    
    // Generate preparation plan based on role type
    const focusAreas = [];
    
    if (isNonTechRole) {
        // Non-tech focus areas
        if (isPM) focusAreas.push("Product Strategy", "Metrics and Analytics");
        if (isSales) focusAreas.push("Sales Methodology", "Objection Handling");
        if (isMarketing) focusAreas.push("Campaign Strategy", "Marketing Analytics");
        if (isDesign) focusAreas.push("Design Process", "User Research");
        if (isHR) focusAreas.push("Talent Management", "Company Culture");
        if (isAnalyst) focusAreas.push("Data Analysis", "Business Intelligence");
        if (isManagement) focusAreas.push("Leadership and Team Management", "Strategic Planning");
        focusAreas.push("Domain Knowledge");
    } else {
        // Tech focus areas
        if (hasReact) focusAreas.push("React and frontend best practices");
        if (hasNode) focusAreas.push("Node.js backend development");
        if (hasMongoDb) focusAreas.push("MongoDB data modeling");
        if (hasSQL) focusAreas.push("SQL database design");
        if (hasDocker) focusAreas.push("Docker and containerization");
        if (hasAWS) focusAreas.push("AWS services and deployment");
        if (hasPython) focusAreas.push("Python and async programming");
        if (hasJava) focusAreas.push("Java and OOP principles");
        if (hasTypeScript) focusAreas.push("TypeScript advanced features");
        if (hasGraphQL) focusAreas.push("GraphQL API design and implementation");
    }
    
    if (focusAreas.length === 0) {
        focusAreas.push("Core concepts", "Problem solving");
    }
    
    return {
        matchScore: Math.round(matchScore),
        technicalQuestions,
        behavioralQuestions,
        skillGaps: skillGaps.slice(0, 5),
        preparationPlan: [
            {
                day: 1,
                focus: focusAreas[0] || "Fundamentals",
                tasks: [
                    `Review ${focusAreas[0]?.split(' ')[0] || 'core'} concepts`,
                    "Research company and role",
                    "Review your experience examples"
                ]
            },
            {
                day: 2,
                focus: focusAreas[1] || "Advanced Topics",
                tasks: [
                    "Study industry trends and best practices",
                    "Prepare concrete examples",
                    "Practice storytelling"
                ]
            },
            {
                day: 3,
                focus: focusAreas[2] || "Strategy",
                tasks: [
                    "Practice scenario-based questions",
                    "Develop thoughtful frameworks",
                    "Discuss complex problems"
                ]
            },
            {
                day: 4,
                focus: "Behavioral Interview",
                tasks: [
                    "Prepare STAR examples (Situation, Task, Action, Result)",
                    "Practice storytelling with impact",
                    "Research company culture and values"
                ]
            },
            {
                day: 5,
                focus: "Mock Interviews",
                tasks: [
                    "Conduct mock interview with peer or mentor",
                    "Practice clear and confident communication",
                    "Final preparation and questions"
                ]
            }
        ]
    };
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    try {
        const prompt = `Generate interview preparation strategy as JSON with no markdown.

Resume: ${resume || "No resume"}
Self Description: ${selfDescription || "No description"}
Job Description: ${jobDescription}

Analyze the role type and tailor the response:
- For tech roles (React, Node, Python, Java, Docker, AWS, SQL, TypeScript, GraphQL): Focus on technical depth and system design
- For PM/Product roles: Focus on strategy, metrics, user research, and cross-functional collaboration
- For Sales roles: Focus on process, objection handling, and relationship building
- For Marketing roles: Focus on campaign strategy, analytics, and growth
- For Design roles: Focus on design process, user research, and collaboration
- For HR/Talent roles: Focus on recruitment, employee development, and culture
- For Management roles: Focus on leadership, team motivation, and strategic execution
- For Analyst roles: Focus on data analysis, insights, and business impact

Return only valid JSON with: matchScore (0-100), technicalQuestions (5+ with question/intention/answer), behavioralQuestions (5+ with question/intention/answer), skillGaps (array with skill/severity), preparationPlan (5+ days with day/focus/tasks array)`

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema)
            }
        })
        
        return JSON.parse(response.text)
    } catch (error) {
        console.error("generateInterviewReport error:", error.message, error.response?.text)
        
        // Handle specific Google AI API errors
        if (error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")) {
            console.log("AI quota exceeded, using dynamic mock data based on input")
            // Return dynamically generated mock data based on job description
            return generateDynamicMockData(jobDescription, selfDescription);
        }
        
        // For any other error, also use dynamic mock data
        console.log("Using dynamic mock data due to error")
        return generateDynamicMockData(jobDescription, selfDescription);
    }
}

async function generateResumePdf({resume, selfDescription, jobDescription}){
    try {
        console.log("Starting PDF generation with PDFKit...")
        const pdfBuffer = await generatePdfWithPdfkit({resume, selfDescription, jobDescription})
        console.log("PDF generation completed, buffer size:", pdfBuffer.length)
        return pdfBuffer
    } catch (error) {
        console.error("generateResumePdf error:", error.message)
        throw error
    }
}

function generatePdfWithPdfkit({resume, selfDescription, jobDescription}) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            })

            const chunks = []
            doc.on("data", (chunk) => chunks.push(chunk))
            doc.on("end", () => {
                const pdfBuffer = Buffer.concat(chunks)
                resolve(pdfBuffer)
            })
            doc.on("error", (err) => reject(err))

            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right

            // --- Header ---
            doc.fontSize(24).font("Helvetica-Bold").fillColor("#1a1a2e")
               .text("Professional Resume", { align: "center" })
            doc.moveDown(0.3)

            // Header underline
            const lineY = doc.y
            doc.moveTo(doc.page.margins.left, lineY)
               .lineTo(doc.page.margins.left + pageWidth, lineY)
               .strokeColor("#1a1a2e").lineWidth(2).stroke()
            doc.moveDown(1)

            // --- Professional Summary ---
            const summaryText = selfDescription || "Experienced professional with strong technical skills."
            drawSectionHeader(doc, "Professional Summary", pageWidth)
            doc.fontSize(11).font("Helvetica").fillColor("#333333")
               .text(summaryText, { align: "left", lineGap: 4 })
            doc.moveDown(1)

            // --- Target Position ---
            if (jobDescription) {
                drawSectionHeader(doc, "Target Position", pageWidth)
                doc.fontSize(11).font("Helvetica").fillColor("#333333")
                   .text(jobDescription, { align: "left", lineGap: 4 })
                doc.moveDown(1)
            }

            // --- Experience & Skills ---
            const resumeText = resume || "Professional experience and technical skills."
            drawSectionHeader(doc, "Experience & Skills", pageWidth)

            // Split resume into lines/paragraphs for better formatting
            const resumeLines = resumeText.split(/\n+/).filter(line => line.trim())
            for (const line of resumeLines) {
                const trimmed = line.trim()
                if (!trimmed) continue

                // Check if we need a new page
                if (doc.y > doc.page.height - 80) {
                    doc.addPage()
                }

                // Detect section-like headings (all caps or ending with colon)
                if (/^[A-Z\s&,/]+$/.test(trimmed) && trimmed.length < 60) {
                    doc.moveDown(0.5)
                    doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a2e")
                       .text(trimmed)
                    doc.moveDown(0.2)
                } else if (trimmed.endsWith(":")) {
                    doc.moveDown(0.3)
                    doc.fontSize(11).font("Helvetica-Bold").fillColor("#444444")
                       .text(trimmed)
                } else {
                    doc.fontSize(10).font("Helvetica").fillColor("#333333")
                       .text(trimmed, { lineGap: 3 })
                }
            }

            // --- Footer ---
            doc.moveDown(2)
            const footerY = doc.y
            if (footerY < doc.page.height - 60) {
                doc.moveTo(doc.page.margins.left, footerY)
                   .lineTo(doc.page.margins.left + pageWidth, footerY)
                   .strokeColor("#cccccc").lineWidth(0.5).stroke()
                doc.moveDown(0.5)
                doc.fontSize(8).font("Helvetica").fillColor("#999999")
                   .text("Generated by AI Resume Analyzer", { align: "center" })
            }

            doc.end()
        } catch (err) {
            reject(err)
        }
    })
}

function drawSectionHeader(doc, title, pageWidth) {
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#1a1a2e")
       .text(title)
    doc.moveDown(0.1)
    const y = doc.y
    doc.moveTo(doc.page.margins.left, y)
       .lineTo(doc.page.margins.left + pageWidth, y)
       .strokeColor("#4a4a8a").lineWidth(1).stroke()
    doc.moveDown(0.5)
}

function generateFallbackResumeHtml({resume, selfDescription, jobDescription}) {
    const safeResume = (resume || '').replace(/[<>]/g, '').substring(0, 1000)
    const safeSelfDesc = (selfDescription || '').replace(/[<>]/g, '').substring(0, 500)
    const safeJobDesc = (jobDescription || '').replace(/[<>]/g, '').substring(0, 500)

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resume</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { color: #666; margin-top: 30px; }
        .section { margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Professional Resume</h1>
    <div class="section">
        <h2>Professional Summary</h2>
        <p>${safeSelfDesc || 'Experienced professional with strong technical skills.'}</p>
    </div>
    <div class="section">
        <h2>Target Position</h2>
        <p><strong>Job Description:</strong> ${safeJobDesc || 'Seeking new opportunities.'}</p>
    </div>
    <div class="section">
        <h2>Experience & Skills</h2>
        <p>${safeResume || 'Professional experience and technical skills.'}</p>
    </div>
</body>
</html>`
}

module.exports = {generateInterviewReport, generateResumePdf, generateFallbackResumeHtml}
