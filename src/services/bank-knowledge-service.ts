import { BankingCategory } from "@/types";

export interface KnowledgeArticle {
  id: string;
  category: BankingCategory;
  title: string;
  summary: string;
  keyDetails: string[];
  eligibilityOrRequirements?: string;
  officialSourceUrl: string;
  keywords: string[];
}

export class BankKnowledgeService {
  private static readonly OFFICIAL_PORTAL = "https://www.hdfc.bank.in";
  private static readonly CUSTOMER_CARE_URL = "https://www.hdfc.bank.in/contact-us/customer-care";

  /**
   * Verified HDFC Bank Knowledge Store derived from official documentation
   */
  private static readonly ARTICLES: KnowledgeArticle[] = [
    // ─── 1. Savings & Current Accounts ───────────────────────────────────────
    {
      id: "hdfc-savings-regular",
      category: "accounts",
      title: "Regular Savings Account",
      summary: "Everyday savings account offering secure digital banking, international debit card, and comprehensive netbanking facilities.",
      keyDetails: [
        "Average Monthly Balance (AMB): ₹10,000 in Metro/Urban branches, ₹5,000 in Semi-Urban branches, ₹2,500 in Rural branches.",
        "Free NetBanking, MobileBanking, and UPI access.",
        "Comes with an EasyShop Platinum or RuPay Debit Card.",
        "Free passbook and email statements.",
      ],
      eligibilityOrRequirements: "Resident individuals, Hindu Undivided Families (HUFs), with valid PAN & Aadhaar (or OVD).",
      officialSourceUrl: "https://www.hdfc.bank.in/personal/save/accounts/savings-accounts",
      keywords: ["savings", "savings account", "open account", "minimum balance", "amb", "regular savings"],
    },
    {
      id: "hdfc-salary-account",
      category: "accounts",
      title: "Corporate Salary Account",
      summary: "Zero-balance salary account with premier benefits, complimentary personal accident insurance, and privileged loan pricing for corporate employees.",
      keyDetails: [
        "Zero minimum balance requirement as long as monthly salary is credited.",
        "Complimentary Personal Accidental Death cover up to ₹1 Crore (variant dependent).",
        "Free unlimited ATM transactions at HDFC Bank ATMs.",
        "Preferential pricing on Personal Loans, Car Loans, and Credit Cards.",
      ],
      eligibilityOrRequirements: "Salaried employee with an approved corporate tie-up with HDFC Bank.",
      officialSourceUrl: "https://www.hdfc.bank.in/personal/save/accounts/salary-accounts",
      keywords: ["salary", "salary account", "corporate salary", "zero balance", "employer"],
    },
    {
      id: "hdfc-digital-account-opening",
      category: "accounts",
      title: "Instant Digital Savings Account (Video KYC)",
      summary: "Open a full-featured HDFC Bank Savings Account completely online in minutes through paperless Video KYC.",
      keyDetails: [
        "100% digital, paperless account opening via smartphone or computer.",
        "Requires Aadhaar linked to mobile number and original PAN card.",
        "Live Video KYC with an HDFC Bank executive verifies identity in real time.",
        "Immediate generation of Account Number, Customer ID, and NetBanking access.",
      ],
      eligibilityOrRequirements: "Indian resident citizen aged 18+ with active Aadhaar-linked mobile & original physical PAN card.",
      officialSourceUrl: "https://www.hdfc.bank.in/personal/save/accounts/digital-savings-account",
      keywords: ["video kyc", "instant account", "online account", "open account online", "paperless"],
    },

    // ─── 2. Fixed & Recurring Deposits ───────────────────────────────────────
    {
      id: "hdfc-fixed-deposit",
      category: "deposits",
      title: "Fixed Deposit (FD)",
      summary: "High-yield guaranteed investment deposit with flexible tenures from 7 days up to 10 years, offering compounding interest.",
      keyDetails: [
        "Tenure flexibility from 7 days to 10 years.",
        "Senior Citizens enjoy an additional 0.50% interest rate premium on standard tenures.",
        "Options for monthly, quarterly, or cumulative interest payout at maturity.",
        "Instant overdraft / loan against FD up to 90% of deposit value without breaking the FD.",
        "Premature withdrawal facility available (subject to applicable guidelines).",
      ],
      eligibilityOrRequirements: "Resident Indians, NRIs, HUFs, minors through guardians.",
      officialSourceUrl: "https://www.hdfc.bank.in/personal/save/deposits/fixed-deposit",
      keywords: ["fd", "fixed deposit", "interest rate", "senior citizen fd", "term deposit", "safe investment"],
    },
    {
      id: "hdfc-recurring-deposit",
      category: "deposits",
      title: "Recurring Deposit (RD)",
      summary: "Disciplined monthly savings plan where you invest a fixed amount every month and earn interest equivalent to Fixed Deposits.",
      keyDetails: [
        "Minimum monthly instalment starts from ₹1,000 (multiples of ₹100 thereafter).",
        "Tenure ranges from 6 months to 120 months (10 years).",
        "Automated monthly debit from linked HDFC Bank savings account.",
      ],
      eligibilityOrRequirements: "Existing HDFC Bank account holder.",
      officialSourceUrl: "https://www.hdfc.bank.in/personal/save/deposits/recurring-deposits",
      keywords: ["rd", "recurring deposit", "monthly deposit", "monthly savings"],
    },

    // ─── 3. Credit & Debit Cards ─────────────────────────────────────────────
    {
      id: "hdfc-millennia-credit-card",
      category: "cards",
      title: "HDFC Bank Millennia Credit Card",
      summary: "Popular lifestyle credit card designed for digital consumers with 5% cashback on leading shopping portals.",
      keyDetails: [
        "5% CashBack on Amazon, Flipkart, Myntra, Swiggy, Zomato, Tata CLiQ, Uber, and Cult.fit.",
        "1% CashBack on all other retail transactions (wallet & fuel excluded).",
        "Complimentary domestic airport lounge access per calendar quarter upon milestone spend.",
        "1% fuel surcharge waiver across all petrol pumps in India.",
      ],
      eligibilityOrRequirements: "Salaried Indian resident (age 21–40, net monthly income ₹35,000+) or Self-employed (ITR ₹6 Lakhs+ p.a.).",
      officialSourceUrl: "https://www.hdfc.bank.in/personal/pay/cards/credit-cards/millennia-credit-card",
      keywords: ["millennia", "credit card", "cashback card", "amazon", "flipkart", "shopping card"],
    },
    {
      id: "hdfc-regalia-gold-credit-card",
      category: "cards",
      title: "HDFC Bank Regalia Gold Credit Card",
      summary: "Premier travel and lifestyle credit card offering luxury reward points, global airport lounge access, and exclusive privileges.",
      keyDetails: [
        "4 Reward Points per ₹150 spent on retail purchases.",
        "Complimentary airport lounge access across India and internationally (via Priority Pass).",
        "Club Vistara Silver Tier and MMT Black Elite memberships on milestone activation.",
        "Low foreign currency markup fee of 2% for international travel.",
      ],
      eligibilityOrRequirements: "Salaried Indian resident (net monthly income ₹1 Lakh+) or Self-employed (ITR ₹12 Lakhs+ p.a.).",
      officialSourceUrl: "https://www.hdfc.bank.in/personal/pay/cards/credit-cards/regalia-gold-credit-card",
      keywords: ["regalia", "regalia gold", "travel card", "lounge access", "premium credit card"],
    },
    {
      id: "hdfc-card-blocking-instant",
      category: "cards",
      title: "Instant Credit / Debit Card Hotlisting & Blocking",
      summary: "Emergency card security procedure to instantly block a lost, stolen, or compromised debit or credit card 24x7.",
      keyDetails: [
        "Call official 24x7 Customer Care: 1800 1600 or 1800 2600 (toll-free in India).",
        "Via NetBanking: Cards > Credit Cards / Debit Cards > Request > Hotlisting.",
        "Via MobileBanking App: Menu > Pay > Cards > Card Actions > Block Card.",
        "Via SMS: Send 'BLOCK <space> Last 4 digits of card' to 5676712 from registered mobile.",
      ],
      officialSourceUrl: "https://www.hdfc.bank.in/personal/pay/cards/debit-cards/block-debit-card",
      keywords: ["block card", "lost card", "stolen card", "hotlist card", "card emergency"],
    },

    // ─── 4. Loans & Credit Facilities ────────────────────────────────────────
    {
      id: "hdfc-home-loan",
      category: "loans",
      title: "HDFC Bank Home Loan",
      summary: "Comprehensive home financing with attractive interest rates, terms up to 30 years, and digital door-step assistance.",
      keyDetails: [
        "Financing for purchase of flats, bungalows, plot purchase, home construction, or home renovation.",
        "Repayment tenure up to 30 years for manageable EMIs.",
        "Quick online sanction and transparent processing fees.",
        "Home Loan Balance Transfer facility with top-up loan options.",
      ],
      eligibilityOrRequirements: "Salaried and self-employed individuals with stable income and verifiable credit track record.",
      officialSourceUrl: "https://www.hdfc.bank.in/personal/borrow/popular-loans/home-loan",
      keywords: ["home loan", "housing loan", "house purchase", "home construction", "plot loan"],
    },
    {
      id: "hdfc-personal-loan",
      category: "loans",
      title: "HDFC Bank Personal Loan",
      summary: "Collateral-free personal financing for medical emergencies, travel, weddings, or home improvement with quick disbursal.",
      keyDetails: [
        "Instant disbursal in 10 seconds for eligible pre-approved bank customers.",
        "Loan amounts up to ₹40 Lakhs with tenure ranging from 12 to 60 months.",
        "Zero security or collateral required.",
        "Competitive interest rates tailored to applicant's credit score and employer profile.",
      ],
      eligibilityOrRequirements: "Salaried employees at reputable corporate / govt organizations, minimum net monthly salary ₹25,000.",
      officialSourceUrl: "https://www.hdfc.bank.in/personal/borrow/popular-loans/personal-loan",
      keywords: ["personal loan", "instant loan", "emergency loan", "unsecured loan", "cash loan"],
    },

    // ─── 5. Digital Banking & Mobile Apps ─────────────────────────────────────
    {
      id: "hdfc-netbanking-mobile",
      category: "digital_banking",
      title: "NetBanking & MobileBanking App",
      summary: "Secure digital banking platform enabling over 250+ banking transactions from home 24x7.",
      keyDetails: [
        "Official NetBanking URL: https://netbanking.hdfcbank.com (Always verify the secure lock icon).",
        "Instant fund transfers via UPI, IMPS (instant 24x7), NEFT, and RTGS.",
        "Manage debit & credit card limits, enable/disable international or online e-commerce transactions.",
        "Download tax certificates, Form 16A, interest certificates, and monthly statements instantly.",
        "WhatsApp Banking: Send 'Hi' to official verified number 70700 22222.",
      ],
      officialSourceUrl: "https://www.hdfc.bank.in/personal/ways-to-bank/online-banking/net-banking",
      keywords: ["netbanking", "mobile banking", "app", "fund transfer", "upi", "statement download", "whatsapp banking"],
    },

    // ─── 6. Fraud & Security Emergency (Strict Safety Protocols) ─────────────
    {
      id: "hdfc-fraud-emergency-protocol",
      category: "fraud_emergency",
      title: "Official Fraud Emergency & Safe Banking Protocol",
      summary: "Immediate steps to protect your account and report unauthorized transactions or phishing attempts.",
      keyDetails: [
        "CRITICAL: Bank officials will NEVER ask for OTP, UPI PIN, ATM PIN, NetBanking password, or CVV.",
        "If an unauthorized transaction occurred, immediately call HDFC Bank 24x7 Toll-Free: 1800 1600 or 1800 2600.",
        "Block compromised cards immediately via NetBanking, MobileBanking, or 1800 1600.",
        "Report cyber financial fraud immediately to National Cyber Crime Helpline: 1930 or online at cybercrime.gov.in.",
        "Do not click suspicious links in SMS or emails asking to 'update KYC' or 'claim reward points'.",
      ],
      officialSourceUrl: "https://www.hdfc.bank.in/personal/useful-links/security",
      keywords: ["fraud", "unauthorized transaction", "money debited", "scam", "phishing", "lost card", "hacked", "security emergency"],
    },

    // ─── 7. Official Customer Care & Branch Locator ──────────────────────────
    {
      id: "hdfc-official-contact-channels",
      category: "customer_service",
      title: "Official HDFC Bank Contact & Customer Care Numbers",
      summary: "Verified official communication channels for HDFC Bank customers across India.",
      keyDetails: [
        "National 24x7 Customer Care (Toll-Free in India): 1800 1600 and 1800 2600.",
        "Grievance Redressal / Complaints: https://www.hdfc.bank.in/contact-us/customer-care",
        "Official WhatsApp Banking: +91 70700 22222 (verified green tick).",
        "Official NetBanking: https://netbanking.hdfcbank.com",
        "Branch & ATM Locator: https://locator.hdfcbank.com",
      ],
      officialSourceUrl: "https://www.hdfc.bank.in/contact-us/customer-care",
      keywords: ["customer care", "helpline", "toll free", "complaint", "phone number", "contact hdfc", "branch", "atm"],
    },
  ];

  /**
   * Search knowledge base using keyword and semantic term matching
   */
  public static search(query: string, category?: BankingCategory): KnowledgeArticle[] {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return this.ARTICLES.slice(0, 4);

    const queryTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 2);

    const scored = this.ARTICLES.map((article) => {
      let score = 0;

      // Category match
      if (category && article.category === category) {
        score += 5;
      }

      // Title match
      if (article.title.toLowerCase().includes(cleanQuery)) {
        score += 10;
      }

      // Keyword matches
      article.keywords.forEach((kw) => {
        if (cleanQuery.includes(kw) || kw.includes(cleanQuery)) {
          score += 4;
        }
      });

      // Token matches in summary and details
      queryTokens.forEach((token) => {
        if (article.title.toLowerCase().includes(token)) score += 3;
        if (article.summary.toLowerCase().includes(token)) score += 2;
        if (article.keyDetails.some((d) => d.toLowerCase().includes(token))) score += 1;
      });

      return { article, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.article);
  }

  /**
   * Get all verified articles
   */
  public static getAllArticles(): KnowledgeArticle[] {
    return [...this.ARTICLES];
  }

  /**
   * Get specific article by ID
   */
  public static getArticleById(id: string): KnowledgeArticle | undefined {
    return this.ARTICLES.find((a) => a.id === id);
  }

  /**
   * Official verified helpline numbers
   */
  public static getOfficialHelplines() {
    return {
      nationalTollFree: ["1800 1600", "1800 2600"],
      national_toll_free: "1800 1600",
      alternate_toll_free: "1800 2600",
      cyberFraudHelpline: "1930",
      whatsAppBanking: "+91 70700 22222",
      officialWebsite: this.OFFICIAL_PORTAL,
      customerCareUrl: this.CUSTOMER_CARE_URL,
    };
  }
}
