import { useEffect } from 'react';
import styled from 'styled-components';
import MenuCard from '../components/MenuCard/MenuCard';
import { useMenu } from '../context/MenuContext';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 32px;
`;

const Title = styled.h1`
  text-align: center;
  padding: 24px 0 0;
  color: #1a1a2e;
  font-size: 2rem;
`;

const Message = styled.p`text-align: center; padding: 40px; color: #888;`;

const MenuPage = () => {
  const { items, loading, error, loadMenu } = useMenu();

  // Trigger load on mount – uses cache if already fetched
  useEffect(() => { loadMenu(); }, [loadMenu]);

  if (loading) return <Message>Loading menu...</Message>;
  if (error)   return <Message>Error: {error}</Message>;

  return (
    <>
      <Title>Our Menu</Title>
      <Grid>
        {items.map((item) => (
          <MenuCard key={item._id} item={item} />
        ))}
      </Grid>
    </>
  );
};

export default MenuPage;
