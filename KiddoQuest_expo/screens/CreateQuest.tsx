import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import MaterialSymbols from 'material-symbols-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);
const StyledImage = styled(Image);
const StyledScrollView = styled(ScrollView);

const CheckBox = ({ checked, onChange }) => {
  return (
    <TouchableOpacity onPress={onChange} className="relative flex h-6 w-6 items-center justify-center">
      <View className={`h-6 w-6 rounded-md border-2 ${checked ? 'bg-primary border-primary' : 'border-gray-400'}`} />
      {checked && <MaterialSymbols name="check" size={18} color="white" style={{ position: 'absolute' }} />}
    </TouchableOpacity>
  );
};

const CreateQuest = () => {
  const [assignees, setAssignees] = useState({
    Leo: false,
    Mia: true,
    Sam: false,
  });

  const handleAssigneeChange = (name) => {
    setAssignees((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <StyledView className="relative flex min-h-screen w-full flex-col">
        {/* Top App Bar */}
        <StyledView className="sticky top-0 z-10 flex-row items-center border-b border-border-light/50 dark:border-border-dark/50 bg-background-light/80 dark:bg-background-dark/80 p-4 pb-3 backdrop-blur-sm">
          <StyledButton className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5">
            <MaterialSymbols name="close" size={24} color="gray" />
          </StyledButton>
          <StyledText className="flex-1 text-center text-lg font-bold text-text-light dark:text-text-dark">Create New Quest</StyledText>
          <StyledView className="size-10 shrink-0" />
        </StyledView>

        {/* Form Content */}
        <StyledScrollView className="flex-1 px-4 py-6">
          <StyledView className="flex-col gap-6">
            {/* Quest Title Field */}
            <StyledView>
              <StyledText className="pb-2 text-base font-medium text-text-light dark:text-text-dark">Quest Title</StyledText>
              <StyledTextInput className="h-14 w-full rounded-lg border border-border-light bg-surface-light p-4 text-base text-text-light placeholder:text-text-light/50 dark:border-border-dark dark:bg-surface-dark dark:text-text-dark" placeholder="e.g., Clean Your Room" />
            </StyledView>
            {/* Description Field */}
            <StyledView>
              <StyledText className="pb-2 text-base font-medium text-text-light dark:text-text-dark">Description</StyledText>
              <StyledTextInput className="min-h-36 w-full rounded-lg border border-border-light bg-surface-light p-4 text-base text-text-light placeholder:text-text-light/50 dark:border-border-dark dark:bg-surface-dark dark:text-text-dark" multiline={true} placeholder="e.g., Put away all toys and make your bed" />
            </StyledView>
            {/* XP Reward List Item */}
            <StyledView className="flex-row items-center justify-between rounded-lg bg-surface-light px-4 py-3 dark:bg-surface-dark">
              <StyledView className="flex-row items-center gap-4">
                <StyledView className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <MaterialSymbols name="stars" size={24} color="#F5A623" />
                </StyledView>
                <StyledText className="flex-1 text-base font-medium text-text-light dark:text-text-dark">XP Reward</StyledText>
              </StyledView>
              <StyledView className="flex-row items-center gap-2">
                <StyledButton className="h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                  <StyledText className="text-lg font-medium">-</StyledText>
                </StyledButton>
                <StyledTextInput className="w-12 text-center text-base font-medium" keyboardType="numeric" defaultValue="100" />
                <StyledButton className="h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                  <StyledText className="text-lg font-medium">+</StyledText>
                </StyledButton>
              </StyledView>
            </StyledView>
            {/* Assign To Section */}
            <StyledView>
              <StyledText className="px-1 pb-2 pt-2 text-lg font-bold text-text-light dark:text-text-dark">Assign To</StyledText>
              <StyledView className="space-y-2 rounded-lg bg-surface-light p-2 dark:bg-surface-dark">
                {/* Child Item 1 */}
                <StyledView className="flex-row items-center gap-4 rounded-md p-3">
                  <StyledImage className="size-10 rounded-full" source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCh1CiokcoDq2cZFCTBsMxOtKo3MzLYrr_EJUXVKPBviwqVS14Jn8JS3WmqTPJhaP97uTb-OQi2mDRcl4Oh85hExBSz4QJbgQUnBdpYWQJsPWzETrGnU94Da6mtKrWYeP9WKCeeMdaoR0EBgsHuA0o1k_uN1T-vhX0ABzCwVcxY1tnvo_O8CPxHzbPXp8PaUqTNERGCxmXP7mo_dvrMm8MM7UEi7M-SEsr6Or9WMgWEtc8y5ifqalKbPFS0gsYV8j_u3Ohtw5Ciy-k' }} />
                  <StyledText className="flex-1 text-base font-medium">Leo</StyledText>
                  <CheckBox checked={assignees.Leo} onChange={() => handleAssigneeChange('Leo')} />
                </StyledView>
                {/* Child Item 2 */}
                <StyledView className="flex-row items-center gap-4 rounded-md p-3">
                    <StyledImage className="size-10 rounded-full" source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMPor98YnIizqc8bddRZwzGD0B6yFoWdCKO1ECO-BD7wGGRR639e91NhcZUU1Nj1859HeQpjV-kRc7zHeZCAV5kfiY0NuP8n3ZFGWs1KsSmvIelCnv2f3UAlUKAqdQmicSpkkAjfOqASo4zoDIQ9LUHvTPKVx5tUujnVjIOuEIEhDEBtHH9kiGTjPlYHxTdFmoWHu8wPVQcI9ltaNIkYYJllNWFLH3oV9aufJ8A4jNcVLs7L9gPLVyFPgh6isqabDdg9JKDomW92M' }} />
                    <StyledText className="flex-1 text-base font-medium">Mia</StyledText>
                    <CheckBox checked={assignees.Mia} onChange={() => handleAssigneeChange('Mia')} />
                </StyledView>
                {/* Child Item 3 */}
                <StyledView className="flex-row items-center gap-4 rounded-md p-3">
                    <StyledImage className="size-10 rounded-full" source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA38-P8W8qdCQYmcxlYesnT1z_OxWIiVOX5KIEDxrygS9UNmT27lgUHEdM8t_j6NJXwD2Fyy7p__aseKQMWn1LjYGrz-E838rq2Bg7fCScp-3hBXDdz2tI5cO-ZKWyWR7kxECCBeDqWl13dc6SYAku7jExgy8uPwgyKYCCl-CiTZbPNs3mGCGY2FJB335uksXvYMWmi8P2NUFn-0QQ1OOxMZoQkCbX7noNJO7PF5IyRNU9DIoDsaeQ9sv3PQ8b-kCVl8brkIf3xPSA' }} />
                    <StyledText className="flex-1 text-base font-medium">Sam</StyledText>
                    <CheckBox checked={assignees.Sam} onChange={() => handleAssigneeChange('Sam')} />
                </StyledView>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledScrollView>

        {/* Sticky Footer Button */}
        <StyledView className="sticky bottom-0 bg-gradient-to-t from-background-light to-transparent p-4 pb-6 dark:from-background-dark">
          <StyledButton className="h-14 w-full rounded-lg bg-primary">
            <StyledText className="text-center text-base font-bold text-white">Save Quest</StyledText>
          </StyledButton>
        </StyledView>
      </StyledView>
    </SafeAreaView>
  );
};

export default CreateQuest;
