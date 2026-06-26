type AmazonProduct = {
  asin: string;
  title: string;
  imageUrl?: string;
  detailPageURL: string;
};

type CreatorsApiItem = {
  asin?: string;
  detailPageURL?: string;
  images?: {
    primary?: {
      small?: {
        url?: string;
      };
      medium?: {
        url?: string;
      };
      large?: {
        url?: string;
      };
    };
  };
  itemInfo?: {
    title?: {
      displayValue?: string;
    };
  };
};

type CreatorsApiResponse = {
  itemsResult?: {
    items?: CreatorsApiItem[];
  };
  ItemsResult?: {
    Items?: CreatorsApiItem[];
  };
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const CreatorsApi = require("@amzn/creatorsapi-nodejs-sdk");

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} が .env.local または Vercel の環境変数に設定されていません`);
  }

  return value;
}

function getOptionalEnv(name: string) {
  return process.env[name] || "";
}

function createAmazonClient() {
  const apiClient = CreatorsApi.ApiClient.instance;

  apiClient.credentialId = getRequiredEnv("AMAZON_CREDENTIAL_ID");
  apiClient.credentialSecret = getRequiredEnv("AMAZON_CREDENTIAL_SECRET");
  apiClient.version = getRequiredEnv("AMAZON_CREDENTIAL_VERSION");

  return new CreatorsApi.DefaultApi();
}

function timeoutPromise(ms: number) {
  return new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), ms);
  });
}

function cleanAmazonPageTitle(title: string) {
  return title
    .replace(/^Amazon\s*[|｜]\s*/i, "")
    .split(/\s+[|｜]\s+/)[0]
    .replace(/\s+/g, " ")
    .trim();
}

function decodeJsonString(value: string) {
  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`);
  } catch {
    return value.replace(/\\\//g, "/");
  }
}

function extractAsin(value: string) {
  const text = decodeURIComponent(value || "").trim();

  if (!text) return "";

  if (/^[A-Z0-9]{10}$/i.test(text)) {
    return text.toUpperCase();
  }

  const dpMatch = text.match(/\/dp\/([A-Z0-9]{10})/i);
  if (dpMatch?.[1]) {
    return dpMatch[1].toUpperCase();
  }

  const gpMatch = text.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  if (gpMatch?.[1]) {
    return gpMatch[1].toUpperCase();
  }

  const asinMatch = text.match(/[?&]asin=([A-Z0-9]{10})/i);
  if (asinMatch?.[1]) {
    return asinMatch[1].toUpperCase();
  }

  const productMatch = text.match(/\/([A-Z0-9]{10})(?:[/?#]|$)/i);
  if (productMatch?.[1]) {
    return productMatch[1].toUpperCase();
  }

  return "";
}

function buildAmazonFallbackUrl(asin: string) {
  const marketplace = getOptionalEnv("AMAZON_MARKETPLACE") || "www.amazon.co.jp";
  const partnerTag = getOptionalEnv("AMAZON_PARTNER_TAG");

  const baseUrl = `https://${marketplace}/dp/${asin}`;

  if (!partnerTag) {
    return baseUrl;
  }

  return `${baseUrl}?tag=${encodeURIComponent(partnerTag)}`;
}

function createFallbackProduct(asin: string): AmazonProduct {
  return {
    asin,
    title: "Amazonで商品を見る",
    detailPageURL: buildAmazonFallbackUrl(asin)
  };
}

async function createAmazonPageFallbackProduct(asin: string): Promise<AmazonProduct> {
  const detailPageURL = buildAmazonFallbackUrl(asin);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(detailPageURL, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      return createFallbackProduct(asin);
    }

    const html = await response.text();
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    const title = cleanAmazonPageTitle(titleMatch?.[1] || "");

    const imageMatch =
      html.match(/data-old-hires="([^"]+)"/i) ||
      html.match(/"hiRes":"([^"]+)"/i) ||
      html.match(/id="landingImage"[^>]+src="([^"]+)"/i) ||
      html.match(/"large":"([^"]+)"/i);

    const imageUrl = imageMatch?.[1]
      ? decodeJsonString(imageMatch[1])
      : undefined;

    return {
      asin,
      title: title || "Amazonで商品を見る",
      imageUrl,
      detailPageURL
    };
  } catch {
    return createFallbackProduct(asin);
  } finally {
    clearTimeout(timeout);
  }
}

function getItemFromResponse(response: CreatorsApiResponse | undefined | null) {
  return (
    response?.itemsResult?.items?.[0] ||
    response?.ItemsResult?.Items?.[0]
  );
}

export async function getAmazonProductByAsin(
  asinOrUrl?: string
): Promise<AmazonProduct | null> {
  if (!asinOrUrl) return null;

  const cleanAsin = extractAsin(asinOrUrl);

  if (!cleanAsin) {
    console.warn(
      "Amazon ASINを取得できませんでした。入力値:",
      asinOrUrl
    );
    return null;
  }

  try {
    const api = createAmazonClient();

    const marketplace = getOptionalEnv("AMAZON_MARKETPLACE") || "www.amazon.co.jp";

    const getItemsRequest = {
      partnerTag: getRequiredEnv("AMAZON_PARTNER_TAG"),
      partnerType: "Associates",
      itemIds: [cleanAsin],
      resources: [
        "images.primary.small",
        "images.primary.medium",
        "images.primary.large",
        "itemInfo.title"
      ]
    };

    const amazonRequest = api.getItems(marketplace, getItemsRequest);

    const response = (await Promise.race([
      amazonRequest,
      timeoutPromise(7000)
    ])) as CreatorsApiResponse | null;

    if (!response) {
      console.warn(
        "Amazon商品情報の取得がタイムアウトしました。代替カードを表示します。ASIN:",
        cleanAsin
      );
      return createAmazonPageFallbackProduct(cleanAsin);
    }

    const item = getItemFromResponse(response);

    if (!item) {
      console.warn(
        "Amazon商品情報が空でした。代替カードを表示します。ASIN:",
        cleanAsin,
        "response:",
        JSON.stringify(response)
      );
      return createAmazonPageFallbackProduct(cleanAsin);
    }

    const title = item.itemInfo?.title?.displayValue || "Amazonで商品を見る";

    const detailPageURL =
      item.detailPageURL || buildAmazonFallbackUrl(cleanAsin);

    const imageUrl =
      item.images?.primary?.medium?.url ||
      item.images?.primary?.large?.url ||
      item.images?.primary?.small?.url;

    return {
      asin: item.asin || cleanAsin,
      title,
      imageUrl,
      detailPageURL
    };
  } catch (error) {
    console.error(
      "Amazon商品情報の取得に失敗しました。代替カードを表示します。ASIN:",
      cleanAsin,
      "error:",
      error
    );

    return createAmazonPageFallbackProduct(cleanAsin);
  }
}
