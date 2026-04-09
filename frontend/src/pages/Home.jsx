import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Play } from 'lucide-react';

const Home = () => {
    const [animes, setAnimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('q');

    const fetchAnimes = async () => {
        setLoading(true);
        try {
            const url = query 
                ? `/api/search?q=${encodeURIComponent(query)}`
                : '/api/search';
            const res = await axios.get(url);
            setAnimes(res.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnimes();
    }, [query]);

    if (loading) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="container">
            <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>
                {query ? `Search results for "${query}"` : 'Trending Anime'}
            </h2>
            
            <div className="grid">
                {animes.length > 0 ? animes.map(anime => (
                    <Link to={`/anime/${anime.slug}`} key={anime._id} className="card">
                        <div className="poster-wrapper">
                            <img 
                                src={anime.poster || 'https://via.placeholder.com/300x450/141417/ffffff?text=No+Poster'} 
                                alt={anime.title} 
                                className="poster"
                            />
                            <div className="card-info">
                                <h3 className="card-title">{anime.title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                                    <Play size={14} fill="currentColor" />
                                    <span>{anime.episodes?.length || 0} Episodes</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                )) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', color: 'var(--text-dim)' }}>
                        No results found. Start by forwarding a video to the bot!
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
