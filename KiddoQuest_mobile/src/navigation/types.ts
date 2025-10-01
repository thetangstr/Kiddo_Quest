export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Registration: undefined;
  ParentDashboard: undefined;
  ChildDashboard: { childId: string };
  AddChild: undefined;
  EditChild: { childId: string };
  ChildSelection: undefined;
  ManageQuests: undefined;
  QuestForm: { questId?: string };
  ManageRewards: undefined;
  RewardForm: { rewardId?: string };
  ManagePenalties: undefined;
  InvitationVerification: { token?: string };
  SubscriptionManagement: undefined;
};
