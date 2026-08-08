/**
 * Shape of a parsed RSS item from Green Jobs Board.
 * Environmental and sustainability job board.
 */
export interface GreenJobsBoardRssItem {
  title: string | null;
  link: string | null;
  guid: string | null;
  description: string | null;
  pubDate: string | null;
  creator: string | null;
  contentEncoded: string | null;
}
