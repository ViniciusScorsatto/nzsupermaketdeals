function buildUrl(base, queryParam, productName) {
  const url = new URL(base);
  url.searchParams.set(queryParam, productName);
  return url.toString();
}

export function buildStoreSearchUrl(storeKey, productName) {
  switch (storeKey) {
    case "woolworths":
      return buildUrl(
        "https://www.woolworths.co.nz/shop/searchproducts",
        "search",
        productName
      );
    case "newworld":
      return buildUrl(
        "https://www.newworld.co.nz/shop/search",
        "q",
        productName
      );
    case "paknsave":
      return buildUrl(
        "https://www.paknsave.co.nz/shop/search",
        "q",
        productName
      );
    default:
      return "";
  }
}
