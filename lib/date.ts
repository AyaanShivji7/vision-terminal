export function getEdmontonDateString() {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Edmonton",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  
    const parts = formatter.formatToParts(new Date());
  
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
  
    return `${year}-${month}-${day}`;
  }