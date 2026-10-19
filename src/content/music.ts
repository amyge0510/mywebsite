// Records on the wall in Amy's room. Later these come live from Spotify; for
// now they're hand-picked. `spotifyId` is the album id from an open.spotify.com
// album link (the part after /album/) and powers the embedded player.

export type Album = {
  title: string;
  artist: string;
  color: string;
  spotifyId?: string;
};

export const records: Album[] = [
  { title: "Album One", artist: "Artist", color: "#d0644b" },
  { title: "Album Two", artist: "Artist", color: "#3c5a8a" },
  { title: "Album Three", artist: "Artist", color: "#e2b34a" },
  { title: "Album Four", artist: "Artist", color: "#6b4a8e" },
  { title: "Album Five", artist: "Artist", color: "#2f7d6a" },
  { title: "Album Six", artist: "Artist", color: "#b84a7a" },
  { title: "Album Seven", artist: "Artist", color: "#8a8a3c" },
  { title: "Album Eight", artist: "Artist", color: "#4a7ab8" },
  { title: "Album Nine", artist: "Artist", color: "#c27a3a" },
];
