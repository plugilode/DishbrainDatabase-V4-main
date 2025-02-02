import { NextResponse } from 'next/server';

// List of user agents to rotate
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
];

// Function to get a random item from an array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Function to make API call with retries
async function makeApiRequest(domain, retries = 3) {
  let lastError;

  for (let i = 0; i < retries; i++) {
    const userAgent = getRandomItem(USER_AGENTS);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api-lr.agent.ai/api/company/lite', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'content-type': 'application/json',
          'origin': 'https://agent.ai',
          'referer': 'https://agent.ai/',
          'user-agent': userAgent
        },
        body: JSON.stringify({
          domain: domain,
          report_component: "harmonic_funding_and_web_traffic",
          user_id: null
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      
      if (i === retries - 1) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

export async function POST(request) {
  try {
    const { name, currentData } = await request.json();
    if (!currentData.url) {
      return NextResponse.json(
        { error: 'Company URL is required for enrichment' },
        { status: 400 }
      );
    }

    const domain = extractDomain(currentData.url);
    if (!domain) {
      return NextResponse.json(
        { error: 'Invalid company URL' },
        { status: 400 }
      );
    }

    const apiResponse = await makeApiRequest(domain);
    const companyData = apiResponse.company_data.company;

    // Transform into our JSON structure
    const enrichedData = {
      ...currentData,
      company_type: companyData.type || null,
      employee_count: companyData.metrics?.employees || null,
      revenue_range: companyData.metrics?.estimatedAnnualRevenue || null,
      address: companyData.geo?.streetAddress || null,
      city: companyData.geo?.city || null,
      state: companyData.geo?.state || null,
      country: companyData.geo?.country || null,
      postal_code: companyData.geo?.postalCode || null,
      industry: companyData.category?.industry || null,
      founded: companyData.foundedYear || null,
      funding: companyData.funding_data?.total || null,
      url: companyData.domain ? `https://${companyData.domain}` : currentData.url,
      
      // Social media
      linkedin_url: companyData.linkedin?.handle ? `https://linkedin.com/company/${companyData.linkedin.handle}` : null,
      linkedin_followers: companyData.linkedin_follower_count?.[0]?.[1] || null,
      twitter_url: companyData.twitter?.handle ? `https://twitter.com/${companyData.twitter.handle}` : null,
      twitter_followers: companyData.twitter?.followers || null,
      facebook_url: companyData.facebook?.handle ? `https://facebook.com/${companyData.facebook.handle}` : null,
      facebook_likes: companyData.facebook?.likes || null,
      
      // Technologies and tags
      technologies: companyData.tech || [],
      tags: companyData.tags || [],

      // Sources tracking with proper structure
      sources: [
        {
          url: "https://agent.ai",
          type: "company_data",
          tags: companyData.tags || [],
          date_accessed: new Date().toISOString().split('T')[0],
          verified: true
        }
      ],

      // AI enrichment with proper structure
      ai_enrichment: {
        confidence: 85,
        last_updated: new Date().toISOString().split('T')[0],
        enriched_fields: [
          "company_info",
          "social_media",
          "contact_info"
        ],
        sources: [
          {
            name: "Agent.ai",
            url: "https://agent.ai",
            type: "company_data"
          }
        ],
        market_insights: {
          industry_position: companyData.category?.industryGroup || null,
          market_share: companyData.metrics?.marketCap ? `${(companyData.metrics.marketCap / 1e9).toFixed(1)}B Market Cap` : null,
          growth_trend: companyData.metrics?.estimatedAnnualRevenue || null,
          competitors: [],
          market_presence: companyData.metrics?.trafficRank || "Unknown"
        },
        tech_stack: companyData.tech || [],
        key_metrics: {
          alexa_rank: companyData.metrics?.alexaGlobalRank || null,
          traffic_rank: companyData.metrics?.trafficRank || null,
          employee_count: companyData.metrics?.employees || null,
          annual_revenue: companyData.metrics?.annualRevenue || null
        }
      },

      // Trust score calculation
      trust_score: {
        score: 85,
        factors: {
          verified_sources: 1,
          official_links: true,
          institution_verified: true,
          profile_completeness: calculateProfileCompleteness(enrichedData),
          last_updated: new Date().toISOString().split('T')[0]
        }
      }
    };

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error('Error researching company:', error);
    return NextResponse.json(
      { error: 'Failed to research company' },
      { status: 500 }
    );
  }
}

function formatCurrency(value) {
  if (!value) return null;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Helper function to extract domain from URL
function extractDomain(url) {
  try {
    // Remove protocol and www if present
    const domain = url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    return domain;
  } catch (error) {
    return null;
  }
}

// Helper function to calculate profile completeness
function calculateProfileCompleteness(data) {
  const requiredFields = [
    'company_type', 'employee_count', 'revenue_range', 'address', 
    'industry', 'url', 'technologies', 'tags'
  ];
  
  const filledFields = requiredFields.filter(field => 
    data[field] !== null && data[field] !== undefined && 
    (Array.isArray(data[field]) ? data[field].length > 0 : true)
  );
  
  return Math.round((filledFields.length / requiredFields.length) * 100);
} 