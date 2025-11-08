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

const ParentDashboard = () => {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <StyledScrollView>
        <StyledView className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden pb-32">
          {/* TopAppBar */}
          <StyledView className="flex flex-row items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
            <StyledView className="text-primary flex size-12 shrink-0 items-center justify-start text-3xl">
              <MaterialSymbols name="emoji_people" size={40} color="#2bee6c" />
            </StyledView>
            <StyledText className="text-slate-800 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Kiddo Quest</StyledText>
            <StyledView className="flex w-12 items-center justify-end">
              <StyledButton className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 bg-transparent text-slate-800 dark:text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0">
                <MaterialSymbols name="settings" size={24} color="white" />
              </StyledButton>
            </StyledView>
          </StyledView>

          {/* HeadlineText */}
          <StyledText className="text-slate-900 dark:text-white tracking-light text-[32px] font-bold leading-tight px-4 text-left pb-3 pt-6">Good morning, Sarah!</StyledText>

          {/* Card: Pending Verifications */}
          <StyledView className="p-4">
            <StyledView className="flex-row items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm">
              <StyledView className="flex-[2_2_0px] flex-col gap-4">
                <StyledView className="flex-col gap-1">
                  <StyledText className="text-slate-900 dark:text-white text-base font-bold leading-tight">Pending Verifications</StyledText>
                  <StyledText className="text-amber-500 dark:text-amber-400 text-sm font-semibold leading-normal">You have 3 quests to verify.</StyledText>
                </StyledView>
                <StyledButton className="flex-row min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-primary/20 text-slate-900 dark:text-white dark:bg-primary/30 pr-2 gap-1 text-sm font-medium leading-normal w-fit">
                  <StyledText className="truncate">View</StyledText>
                  <MaterialSymbols name="arrow_forward" size={18} color="white" />
                </StyledButton>
              </StyledView>
              <StyledView className="flex-1 items-center justify-center text-primary">
                <MaterialSymbols name="checklist_rtl" size={60} color="#2bee6c" style={{ opacity: 0.3 }} />
              </StyledView>
            </StyledView>
          </StyledView>

          {/* SectionHeader */}
          <StyledText className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Recent Activity</StyledText>

          {/* ListItem 1 */}
          <StyledView className="flex-row items-center gap-4 bg-transparent px-4 min-h-[72px] py-2 justify-between">
            <StyledView className="flex-row items-center gap-4">
              <StyledImage source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7B3vWL8_63yQhLv899e8O1EL43iw0E-jA85J6JCreeVPaREKrFkjeYm8BqOgKKJGMHBt4NwoiQZIDwF7trJkmWrSJB-5IwXthR8FKz-xp_qf9dZeq5TJbi4KZi8roZ5G3loYXZPCg-sy-LxHLgyGsqAJeOjv3f92-zUIMF0-SNUzDGex4egls_3jkIpHMWvx0BuddqhEBFC5QohHMzb_LmYV-ByZ8aJ1YUEGIwb1mf4n6act66y-PyLX44-BKzIPkO5jM87m_0S8' }} className="rounded-full h-14 w-14" />
              <StyledView className="flex-col justify-center">
                <StyledText className="text-slate-800 dark:text-white text-base font-medium leading-normal">Leo completed 'Tidy Up Room'</StyledText>
                <StyledText className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal">Earned 15 points</StyledText>
              </StyledView>
            </StyledView>
            <StyledText className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal">5m ago</StyledText>
          </StyledView>

          {/* ... more list items ... */}

        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};

export default ParentDashboard;
