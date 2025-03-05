import axios from "axios";

/** Fetch data from the API */
export async function fetchData(url, token) {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching data:", err);
    throw err;
  }
}
