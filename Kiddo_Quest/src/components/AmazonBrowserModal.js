import React, { useState } from 'react';
import { Search, X, ShoppingCart } from 'lucide-react';
import { Button, Card, InputField, Modal, LoadingSpinner } from './UI';
import { getFunctions, httpsCallable } from 'firebase/functions';

const AmazonBrowserModal = ({ isOpen, onClose, onProductSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);

  // Debug logging
  console.log('AmazonBrowserModal render:', { isOpen, searchQuery, searchResults: searchResults.length });

  // Function to search for Amazon products
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    console.log('Starting Amazon search for:', searchQuery);
    setIsSearching(true);
    setError(null);

    try {
      // Call the Firebase Cloud Function for Amazon product search
      const response = await searchAmazonProducts(searchQuery);
      console.log('Search response:', response);
      
      setSearchResults(response.items || []);
      
      // Show a warning if using mock data
      if (response.isMockData && response.error) {
        setError(`${response.error} - Results may not be accurate.`);
      } else if (response.isMockData) {
        setError("Using demo data - configure Amazon API for real results.");
      }
    } catch (err) {
      console.error("Error searching Amazon products:", err);
      setError("Failed to search products. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Function to search Amazon products using Firebase Cloud Function
  const searchAmazonProducts = async (query) => {
    try {
      const functions = getFunctions();
      const searchAmazon = httpsCallable(functions, 'searchAmazonProducts');
      
      const result = await searchAmazon({ 
        query: query,
        maxResults: 10 
      });
      
      if (result.data.success) {
        // Transform Firebase function response to match expected format
        const items = result.data.products.map(product => ({
          id: product.asin,
          title: product.title,
          description: product.description,
          price: product.price?.displayValue || 'Price not available',
          image: product.images?.primary || 'https://via.placeholder.com/150',
          url: product.amazonUrl || product.partnerUrl,
          asin: product.asin,
          brand: product.brand,
          availability: product.availability,
          isMockData: product.isMockData || false
        }));
        
        return { 
          items,
          isMockData: result.data.isMockData,
          error: result.data.error 
        };
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Error calling Firebase function:', error);
      
      // Fallback to mock data if Firebase function fails
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        items: [
          {
            id: 'FALLBACK1',
            title: `${query} Book for Kids`,
            description: `Educational ${query} book for children ages 5-12. Great for learning and fun activities.`,
            price: '$19.99',
            image: 'https://via.placeholder.com/150',
            url: 'https://www.amazon.com/dp/fallback1',
            isMockData: true
          },
          {
            id: 'FALLBACK2',
            title: `${query} Learning Toy`,
            description: `Interactive ${query} toy that helps with cognitive development and motor skills.`,
            price: '$34.95',
            image: 'https://via.placeholder.com/150',
            url: 'https://www.amazon.com/dp/fallback2',
            isMockData: true
          },
          {
            id: 'FALLBACK3',
            title: `${query} Game Set`,
            description: `Fun ${query} game for the whole family. Includes multiple activities and challenges.`,
            price: '$24.50',
            image: 'https://via.placeholder.com/150',
            url: 'https://www.amazon.com/dp/fallback3',
            isMockData: true
          },
        ],
        isMockData: true,
        error: 'Failed to connect to Amazon API, showing fallback results'
      };
    }
  };

  const handleProductSelect = (product) => {
    onProductSelect({
      title: product.title,
      description: product.description,
      image: product.image,
      source: {
        type: 'amazon',
        price: product.price,
        url: product.url
      }
    });
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Browse Amazon Rewards"
      size="xl"
    >
      <div className="p-4">
        <form onSubmit={handleSearch} className="flex space-x-2 mb-6">
          <InputField
            placeholder="Search Amazon products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 mb-0"
          />
          <Button 
            type="submit" 
            variant="primary" 
            icon={Search}
            disabled={isSearching || !searchQuery.trim()}
          >
            Search
          </Button>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {isSearching ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner message="Searching products..." />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((product) => (
              <Card key={product.id} className="p-4 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex mb-3">
                    <div className="w-24 h-24 mr-4 flex-shrink-0">
                      <img 
                        src={product.image} 
                        alt={product.title} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-indigo-700 text-sm mb-1">{product.title}</h3>
                      <p className="text-purple-700 font-medium">{product.price}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 flex-grow">{product.description}</p>
                  <div className="mt-auto">
                    <Button
                      variant="secondary"
                      icon={ShoppingCart}
                      onClick={() => handleProductSelect(product)}
                      className="w-full"
                    >
                      Use as Reward
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : searchQuery && !isSearching ? (
          <div className="text-center py-8 text-gray-500">
            No products found for "{searchQuery}". Try a different search term.
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart size={48} className="mx-auto mb-4 text-gray-400" />
            <p>Search for Amazon products to add as rewards</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AmazonBrowserModal;
