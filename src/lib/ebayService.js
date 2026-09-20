const EBAY_API_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const EBAY_OAUTH_TOKEN = "YOUR_OAUTH_TOKEN"; // Replace with your eBay OAuth token

export const fetchGamePrices = async (gameTitle, platform) => {
  const query = encodeURIComponent(`${gameTitle} ${platform}`);
  const url = `${EBAY_API_URL}?q=${query}&category_ids=139973&limit=5`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${EBAY_OAUTH_TOKEN}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching eBay data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.itemSummaries.map(item => ({
      title: item.title,
      price: item.price.value,
      currency: item.price.currency,
      url: item.itemWebUrl,
      image: item.image.imageUrl,
    }));
  } catch (error) {
    console.error("Error fetching game prices:", error);
    return [];
  }
};
