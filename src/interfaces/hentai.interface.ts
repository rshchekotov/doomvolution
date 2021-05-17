export interface Hentai {
    id: number;
    title: {
        english: string;
        japanese: string;
    };
    media_id: string;
    num_pages: number;
    tags: Array<{
        id: number;
        type: string;
        name: string;
    }>;
}