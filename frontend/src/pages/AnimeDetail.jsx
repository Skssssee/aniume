import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { PlayCircle, Info, Calendar } from 'lucide-react';

const AnimeDetail = () => {
    const { slug } = useParams();
    const [anime, setAnime] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await axios.get(`/api/anime/${slug}`);
                setAnime(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [slug]);

    if (loading) return <div className="container">Loading...</div>;
    if (!anime) return <div className="container">Anime not found.</div>;

    return (
        <div className="container" style={{ paddingBottom: '50px' }}>
            <div className="hero-section" style={{ display: 'flex', gap: '40px', marginTop: '30px' }}>
                <div style={{ flex: '0 0 300px' }}>
                    <img 
                        src={anime.poster || 'https://via.placeholder.com/300x450/141417/ffffff?text=No+Poster'} 
                        alt={anime.title} 
                        style={{ width: '100%', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                    />
                </div>
                
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '20px' }}>{anime.title}</h1>
                    
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', color: 'var(--text-dim)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={18} />
                            <span>{new Date(anime.created_at).getFullYear()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <PlayCircle size={18} />
                            <span>{anime.episodes.length} Episodes</span>
                        </div>
                    </div>

                    <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '40px' }}>
                        {anime.description || 'No description available for this title.'}
                    </p>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        {anime.episodes.length > 0 && (
                            <Link to={`/watch/${anime.episodes[0]._id}?hash=${anime.episodes[0].watch_url.split('hash=')[1]}`} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <PlayCircle size={20} fill="white" />
                                Watch Now (Ep 1)
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '60px' }}>
                <h2 style={{ fontSize: '1.8rem', borderBottom: '2px solid var(--border)', paddingBottom: '10px', marginBottom: '20px' }}>Episodes</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {anime.episodes.map(ep => (
                        <Link 
                            key={ep._id} 
                            to={`/watch/${ep._id}?hash=${ep.watch_url.split('hash=')[1]}`}
                            className="glass"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '15px 20px',
                                borderRadius: '8px',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                        >
                            <span style={{ color: 'var(--accent)', fontWeight: 'bold', width: '40px' }}>{ep.episode_number}</span>
                            <span style={{ flex: 1 }}>{ep.title}</span>
                            <PlayCircle size={20} color="var(--text-dim)" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnimeDetail;
