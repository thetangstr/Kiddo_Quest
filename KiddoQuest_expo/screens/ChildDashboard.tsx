import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import MaterialSymbols from 'material-symbols-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledButton = styled(TouchableOpacity);
const StyledImage = styled(Image);
const StyledScrollView = styled(ScrollView);

const ChildDashboard = () => {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <StyledScrollView>
        <StyledView className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
          {/* Header */}
          <StyledView className="p-4 pt-6">
            <StyledView className="flex-row justify-between items-center gap-4">
              <StyledView className="flex-row gap-4 items-center">
                <StyledImage source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmCj6jd1mUUTKo5xbB7Dw13yjBCYAXQ8C6f2j2KJ08nb3n6NWCnsvgjveivqbou0CgzLxjZs45svEZuU2SsbgmxFOHVmZSe6yVXAuwLkGjE9feMlEtA_9aOVJswwXViFSIt2t4EYPYDW_daLahs5b-7Sx8j200XrRnRgKrtzqt5WzQRrk7yfbwKmdoSI59Mw_kAWxq0ae9NYaINwzqOSopFwiqXFyZ7ouop8Hzj8qUuoj2y45xVX9DoXzqn0fhkXg4G9xDv6Ry-DM' }} className="rounded-full h-16 w-16 border-2 border-primary" />
                <StyledView className="flex-col justify-center">
                  <StyledText className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold">Leo</StyledText>
                  <StyledText className="text-text-light-secondary dark:text-text-dark-secondary text-base font-medium flex-row items-center gap-1">
                    <MaterialSymbols name="star" size={18} color="#FFC107" />
                    150 XP
                  </StyledText>
                </StyledView>
              </StyledView>
              <StyledButton className="p-2 rounded-full text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-200 dark:hover:bg-card-dark">
                <MaterialSymbols name="settings" size={24} color="gray" />
              </StyledButton>
            </StyledView>
          </StyledView>

          {/* Your Quests for Today Section */}
          <StyledView>
            <StyledText className="text-text-light-primary dark:text-text-dark-primary text-[22px] font-bold px-4 pb-3 pt-5">Your Quests for Today</StyledText>
            <StyledScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
              <StyledView className="flex-row px-4 gap-4">
                {/* Quest Card 1 */}
                <StyledView className="flex-col gap-3 rounded-lg bg-card-light dark:bg-card-dark p-4 w-40 shadow-sm">
                  <StyledView className="w-full bg-primary/20 rounded-lg flex items-center justify-center aspect-square">
                    <MaterialSymbols name="bed" size={40} color="#2bee6c" />
                  </StyledView>
                  <StyledView>
                    <StyledText className="text-text-light-primary dark:text-text-dark-primary text-base font-medium">Make Your Bed</StyledText>
                    <StyledText className="text-text-light-secondary dark:text-text-dark-secondary text-sm">+10 XP</StyledText>
                  </StyledView>
                </StyledView>
                {/* ... more quest cards ... */}
              </StyledView>
            </StyledScrollView>
          </StyledView>

          {/* Awesome Rewards Section */}
          <StyledView className="pb-8">
            <StyledText className="text-text-light-primary dark:text-text-dark-primary text-[22px] font-bold px-4 pb-3 pt-8">Awesome Rewards</StyledText>
            <StyledScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
              <StyledView className="flex-row px-4 gap-4">
                {/* Reward Card 1 */}
                <StyledView className="flex-col gap-3 rounded-lg bg-card-light dark:bg-card-dark p-4 w-40 shadow-sm">
                  <StyledView className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center aspect-square">
                    <MaterialSymbols name="stadia_controller" size={40} color="gray" />
                  </StyledView>
                  <StyledView>
                    <StyledText className="text-text-light-primary dark:text-text-dark-primary text-base font-medium">30 Mins Game Time</StyledText>
                    <StyledText className="text-text-light-secondary dark:text-text-dark-secondary text-sm">-100 XP</StyledText>
                  </StyledView>
                </StyledView>
                {/* ... more reward cards ... */}
              </StyledView>
            </StyledScrollView>
          </StyledView>
        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};

export default ChildDashboard;
