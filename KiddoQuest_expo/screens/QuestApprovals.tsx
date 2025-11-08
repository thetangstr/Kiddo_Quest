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

const QuestApprovals = () => {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <StyledView className="relative flex min-h-screen w-full flex-col">
        {/* Top App Bar */}
        <StyledView className="sticky top-0 z-10 flex-row items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between">
          <StyledButton className="flex size-10 shrink-0 items-center justify-center">
            <MaterialSymbols name="arrow_back" size={24} color="gray" />
          </StyledButton>
          <StyledText className="text-lg font-bold flex-1 text-center">Quest Approvals</StyledText>
          <StyledView className="size-10 shrink-0" />
        </StyledView>

        <StyledScrollView className="flex-1 px-4 pt-4 pb-6">
          {/* Chips */}
          <StyledView className="flex-row gap-3 pb-4">
            <StyledView className="flex-row h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/20 pl-3 pr-4">
              <MaterialSymbols name="notifications" size={18} color="black" />
              <StyledText className="text-sm font-medium">3 Quests to Review</StyledText>
            </StyledView>
          </StyledView>

          {/* Quest List */}
          <StyledView className="flex-col gap-4">
            {/* List Item 1 */}
            <StyledView className="flex-col gap-3 rounded-lg bg-white dark:bg-zinc-800 p-4 shadow-sm">
              <StyledView className="flex-row items-center gap-4">
                <StyledImage className="rounded-full h-14 w-14" source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC6-fhBi9isflsIHY4GZZLejJDDU8EKWKnSrlsvukNMYe4bf2DzkrNoJlvhDJECNqgAgXpGEMtWDycRNPmtXj6BJIYzb6xecy9D_EdxwZbpnAJOlHXgiM1VegCepzIcUgjWwhWaPaZYiY7F2iKAwh4GlCbfueh9gC9ZUdHCJJcONLEpICk7RSWyVsU2JT5r2xXmW1TVmn1y4Ywe6A6B2YL-hOOotFzXAFmrXnG7XE20uETRmbCAMR3j5ZYTOe9G0CBkbxQBKfFgu4' }} />
                <StyledView className="flex-1">
                  <StyledText className="text-base font-semibold">Clean Your Room</StyledText>
                  <StyledText className="text-sm text-zinc-500 dark:text-zinc-400">Completed by Alex: Yesterday</StyledText>
                </StyledView>
              </StyledView>
              <StyledView className="flex-row items-center gap-3">
                <StyledButton className="flex-1 flex-row items-center justify-center h-10 rounded-full bg-red-100 dark:bg-red-900/40">
                  <MaterialSymbols name="close" size={20} color="red" />
                  <StyledText className="text-center text-red-600 dark:text-red-400 font-bold">Reject</StyledText>
                </StyledButton>
                <StyledButton className="flex-1 flex-row items-center justify-center h-10 rounded-full bg-primary">
                  <MaterialSymbols name="check" size={20} color="black" />
                  <StyledText className="text-center font-bold">Approve</StyledText>
                </StyledButton>
              </StyledView>
            </StyledView>
            {/* ... more list items */}
          </StyledView>
        </StyledScrollView>
      </StyledView>
    </SafeAreaView>
  );
};

export default QuestApprovals;
