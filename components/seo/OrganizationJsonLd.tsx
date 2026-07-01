// Skill #20 — Organization + WebSite + SearchAction JSON-LD
// Used on the homepage only

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://farmersfactory.in/#organization',
        name: 'Farmers Factory',
        url: 'https://farmersfactory.in',
        logo: {
          '@type': 'ImageObject',
          url: 'https://farmersfactory.in/icons/logo.png',
          width: 512,
          height: 512,
        },
        description: 'Farmers Factory delivers fresh farm-to-door groceries within 24 hours across India.',
        foundingDate: '2024',
        foundingLocation: {
          '@type': 'Place',
          addressLocality: 'Mumbai',
          addressCountry: 'IN',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'info.thefarmersfactory@gmail.com',
          telephone: '+91-89258-78327',
          availableLanguage: ['English', 'Hindi'],
        },
        sameAs: [
          'https://twitter.com/farmersfactory_in',
          'https://www.instagram.com/farmersfactory.in',
          'https://www.linkedin.com/company/farmersfactory-in',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://farmersfactory.in/#website',
        url: 'https://farmersfactory.in',
        name: 'Farmers Factory',
        publisher: { '@id': 'https://farmersfactory.in/#organization' },
        potentialAction: {
          // Skill #20 — SearchAction enables Google Sitelinks Search Box
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://farmersfactory.in/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
