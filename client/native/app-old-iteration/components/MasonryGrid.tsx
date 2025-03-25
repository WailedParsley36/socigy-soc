import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, Dimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image'

const calculateColumnWidth = (numColumns) => {
  const screenWidth = Dimensions.get('window').width;
  return (screenWidth - (numColumns + 1) * 10) / numColumns; // 10px for spacing
};

const MasonryGrid = ({ data, numColumns = 2 }) => {
  const [columnWidth, setColumnWidth] = useState(calculateColumnWidth(numColumns));

  useEffect(() => {
    const handleResize = () => {
      setColumnWidth(calculateColumnWidth(numColumns));
    };

    // Update column width when screen size changes
    const subscription = Dimensions.addEventListener('change', handleResize);

    return () => {
      subscription.remove();
    };
  }, [numColumns]);

  // Function to generate a random height (for demo purposes, replace with actual image height if needed)
  const getItemHeight = () => {
    return 200 + Math.floor(Math.random() * 100); // Example random height
  };

  // Keep track of the height of each column
  const columnHeights = Array.from({ length: numColumns }, () => 0);

  // Determine the correct column for the item
  const getColumnForItem = (index) => {
    const columnIndex = index % numColumns;
    return columnIndex;
  };

  const renderItem = ({ item, index }) => {
    const columnIndex = getColumnForItem(index);
    const itemHeight = getItemHeight(); // Adjust height of item (e.g., based on image aspect ratio)

    // Update the height of the corresponding column after rendering the item
    columnHeights[columnIndex] += itemHeight;

    return (
      <View
        style={[
          styles.item,
          {
            width: columnWidth,
            height: itemHeight,
            marginLeft: columnIndex > 0 ? 10 : 0, // Add margin between columns
            marginBottom: 10,
            position: 'absolute',
            top: columnHeights[columnIndex] - itemHeight, // Position each item based on the column height
          },
        ]}
      >
        <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%' }} cachePolicy='memory-disk' />
        <Text>{item.title}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={{ paddingBottom: 10 }}
      showsVerticalScrollIndicator={false}
      style={styles.gridContainer}
    />
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
  },
  item: {
    marginBottom: 10,
  },
});

export default MasonryGrid;
