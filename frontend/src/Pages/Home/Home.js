import React, { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import './Home.css';
import PhoneTree from '../../Components/PhoneTree/PhoneTree';
import UserInfo from '../../Components/UserInfo/UserInfo';
import { TextField, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import { useSubscription } from '../../Context/SubscriptionContext';

function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState(null);
    const [organizationData, setOrganizationData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    const { subscriptions, loading: subscriptionLoading, error: subscriptionError, addSubscription, editSubscription, deleteSubscription } = useSubscription();

    const user = JSON.parse(localStorage.getItem("user"));
    const isRoleAdmin = user && user.role === 1;

    // Function to fetch organization data
    const fetchOrganizationData = async () => {
        setLoading(true);
        try {
            const endpoint = isRoleAdmin ? '/api/directory/getTree' : '/api/directory/getTreeForUser';
            const response = await axios.get(endpoint);
            setOrganizationData(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Veri yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch user info
    const fetchUserInfo = async (nodeId) => {
        if (nodeId) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`/api/directory/getNode/${nodeId}`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  
                setUserInfo(response.data);
            } catch (error) {
                console.error("Error fetching user info:", error);
                setUserInfo(null);
            }
        }
    };

    useEffect(() => {
        fetchOrganizationData();
    }, []);

    useEffect(() => {
        if (selectedNode && selectedNode.id) {
            fetchUserInfo(selectedNode.id);
        }
    }, [selectedNode]);

    const handleNodeSelect = (node) => {
        setSelectedNode(node);
    };

    const handleSaveSuccess = () => {
        fetchOrganizationData(); // Ağacı yeniden yükle
        if (selectedNode && selectedNode.id) {
            fetchUserInfo(selectedNode.id); // Kullanıcı bilgilerini yeniden yükle
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Container className="home-main-container">
            <div className="phone-tree-container">
                <TextField
                    className="custom-textfield"
                    variant="outlined"
                    placeholder="Arama yapın..."
                    size="small"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                    fullWidth
                />
                {loading ? (
                    <CircularProgress />
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <PhoneTree 
                        data={organizationData} 
                        searchTerm={searchTerm} 
                        onNodeSelect={handleNodeSelect} 
                    />
                )}
            </div>

            {/* Tab yapısı ekleniyor */}
            <div className="user-info-container">
                {isRoleAdmin ? (
                    <UserInfo 
                        user={userInfo} 
                        onSaveSuccess={handleSaveSuccess} 
                        addSubscription={addSubscription}
                        editSubscription={editSubscription}
                        deleteSubscription={deleteSubscription}
                    />
                ) : (
                    <>
                        <div className="user-info-tabs">
                            <Tabs 
                                value={tabValue} 
                                onChange={handleTabChange} 
                                aria-label="User Information Tabs"
                            >
                                <Tab label="Sabit Numara" />
                                <Tab label="Ip Numara" />
                                <Tab label="Posta Kutusu" />
                            </Tabs>
                        </div>
                        
                        <div className="user-info-content">
                            {/* TabValue'yi UserInfo'ya prop olarak gönderiyoruz */}
                            <UserInfo 
                                user={userInfo} 
                                onSaveSuccess={handleSaveSuccess} 
                                addSubscription={addSubscription}
                                editSubscription={editSubscription}
                                deleteSubscription={deleteSubscription}
                                tabValue={tabValue}  // Hangi tab'tan geldiğini gösteren parametre
                            />
                        </div>
                    </>
                )}
            </div>

        </Container>
    );
}

export default Home;
