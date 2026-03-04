const COUNTRY_DEFAULTS = {
  'United States': 'USD',
  India: 'INR',
  UAE: 'AED'
};

const PRICE_LIBRARY = {
  Netflix: {
    category: 'Streaming',
    plans: {
      Standard: {
        USD: { price: 15.49, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 649, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 56, country: 'UAE', updatedAt: '2026-01-10' }
      },
      Premium: {
        USD: { price: 22.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 799, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 71, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  Spotify: {
    category: 'Music',
    plans: {
      Individual: {
        USD: { price: 11.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 119, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 22.99, country: 'UAE', updatedAt: '2026-01-10' }
      },
      Family: {
        USD: { price: 19.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 179, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 34.99, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  'YouTube Premium': {
    category: 'Streaming',
    plans: {
      Individual: {
        USD: { price: 13.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 129, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 26.99, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  'Apple Music': {
    category: 'Music',
    plans: {
      Individual: {
        USD: { price: 10.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 99, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 21.99, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  'Amazon Prime': {
    category: 'Shopping',
    plans: {
      Monthly: {
        USD: { price: 14.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 299, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 16, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  'Disney+': {
    category: 'Streaming',
    plans: {
      Standard: {
        USD: { price: 9.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 299, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 36.99, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  Hulu: {
    category: 'Streaming',
    plans: {
      Basic: {
        USD: { price: 9.99, country: 'United States', updatedAt: '2026-01-10' },
        AED: { price: 36.99, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  Max: {
    category: 'Streaming',
    plans: {
      Standard: {
        USD: { price: 16.99, country: 'United States', updatedAt: '2026-01-10' },
        AED: { price: 45.99, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  'iCloud+': {
    category: 'Storage',
    plans: {
      '200GB': {
        USD: { price: 2.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 219, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 12.99, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  'Google One': {
    category: 'Storage',
    plans: {
      Premium: {
        USD: { price: 9.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 650, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 36.99, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  'Microsoft 365': {
    category: 'Productivity',
    plans: {
      Personal: {
        USD: { price: 6.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 489, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 29, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  'Adobe Creative Cloud': {
    category: 'Productivity',
    plans: {
      'All Apps': {
        USD: { price: 59.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 4596, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 224.99, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  ChatGPT: {
    category: 'AI',
    plans: {
      Plus: {
        USD: { price: 20, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 1999, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 74, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  Zoom: {
    category: 'Productivity',
    plans: {
      Pro: {
        USD: { price: 15.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 1300, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 59, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  },
  Canva: {
    category: 'Design',
    plans: {
      Pro: {
        USD: { price: 14.99, country: 'United States', updatedAt: '2026-01-10' },
        INR: { price: 499, country: 'India', updatedAt: '2026-01-10' },
        AED: { price: 56, country: 'UAE', updatedAt: '2026-01-10' }
      }
    }
  }
};

function resolvePrice(service, plan, currency) {
  const serviceEntry = PRICE_LIBRARY[service];
  if (!serviceEntry || !serviceEntry.plans[plan]) {
    return { found: false, message: 'Not available-enter manually' };
  }

  const byCurrency = serviceEntry.plans[plan][currency];
  if (byCurrency) {
    return {
      found: true,
      amount: byCurrency.price,
      updatedAt: byCurrency.updatedAt,
      closest: null,
      category: serviceEntry.category
    };
  }

  const fallbackCurrency = Object.keys(serviceEntry.plans[plan])[0];
  const fallback = serviceEntry.plans[plan][fallbackCurrency];
  return {
    found: false,
    message: 'Not available-enter manually',
    closest: {
      currency: fallbackCurrency,
      amount: fallback.price,
      country: fallback.country,
      updatedAt: fallback.updatedAt
    },
    category: serviceEntry.category
  };
}

module.exports = { PRICE_LIBRARY, COUNTRY_DEFAULTS, resolvePrice };
