
import { colors } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FAVORITE_COLORS = [
  'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Black', 'White', 'Brown', 'Gray'
];

const FOOD_TYPES = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Indian', 'American', 'Mediterranean',
  'Vegan', 'Vegetarian', 'Pescatarian', 'BBQ', 'Seafood', 'Fast Food', 'Other'
];

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut, markFirstLoginComplete } = useAuth();
  const router = useRouter();

  const isFirstLogin = user?.firstLoginCompleted === false;
  const [isEditing, setIsEditing] = useState(isFirstLogin);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageKey, setProfileImageKey] = useState<string | null>(null);
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [favoriteColor, setFavoriteColor] = useState('');
  const [favoriteFoodType, setFavoriteFoodType] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [notes, setNotes] = useState('');
  
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFoodPicker, setShowFoodPicker] = useState(false);

  const loadProfileData = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('[Profile] Loading profile data from backend...');
      const { authenticatedGet } = await import('@/utils/api');
      const profileData = await authenticatedGet('/api/user/profile');
      
      console.log('[Profile] Profile data loaded:', profileData);
      
      if (profileData.name) setName(profileData.name);
      if (profileData.image) setProfileImage(profileData.image);
      if (profileData.age) setAge(profileData.age.toString());
      if (profileData.location) setLocation(profileData.location);
      if (profileData.phoneNumber) setPhoneNumber(profileData.phoneNumber);
      if (profileData.favoriteColor) setFavoriteColor(profileData.favoriteColor);
      if (profileData.favoriteFoodType) setFavoriteFoodType(profileData.favoriteFoodType);
      if (profileData.instagram) setInstagram(profileData.instagram);
      if (profileData.twitter) setTwitter(profileData.twitter);
      if (profileData.notes) setNotes(profileData.notes);
    } catch (error) {
      console.error('[Profile] Error loading profile data:', error);
    }
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    if (isFirstLogin) {
      setIsEditing(true);
    }
  }, [isFirstLogin]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      
      try {
        console.log('[Profile] Uploading profile image...');
        
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'profile-image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('file', {
          uri,
          name: filename,
          type,
        } as any);

        // FIX: Get auth headers properly using supabase
        const { supabase } = await import('@/lib/supabase');
        const { BACKEND_URL } = await import('@/utils/api');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          throw new Error('No access token found');
        }
        
        const uploadResponse = await fetch(`${BACKEND_URL}/api/user/profile-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        console.log('[Profile] Image uploaded successfully:', uploadData.url);
        
        setProfileImageKey(uploadData.key);
      } catch (error) {
        console.error('[Profile] Image upload failed:', error);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log('[Profile] Saving profile data...');
      
      const profileData: any = {
        name: name.trim(),
      };
      
      if (age) profileData.age = parseInt(age);
      if (location) profileData.location = location.trim();
      if (phoneNumber) profileData.phoneNumber = phoneNumber.trim();
      if (favoriteColor) profileData.favoriteColor = favoriteColor;
      if (favoriteFoodType) profileData.favoriteFoodType = favoriteFoodType;
      if (instagram) profileData.instagram = instagram.trim();
      if (twitter) profileData.twitter = twitter.trim();
      if (notes) profileData.notes = notes.trim();
      if (profileImage) profileData.image = profileImage;
      if (profileImageKey) profileData.imageKey = profileImageKey;
      
      const { authenticatedPut } = await import('@/utils/api');
      await authenticatedPut('/api/user/profile', profileData);
      console.log('[Profile] Profile data saved successfully');
      
      if (isFirstLogin) {
        console.log('[Profile] First login - marking as complete');
        
        const { authenticatedPost } = await import('@/utils/api');
        await authenticatedPost('/api/user/complete-profile', {});
        
        await markFirstLoginComplete();
        
        Alert.alert(
          'Profile Complete!',
          'Welcome to THE ROSTER! Your profile has been set up.',
          [
            {
              text: 'Get Started',
              onPress: () => {
                setIsEditing(false);
              }
            }
          ]
        );
      } else {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('[Profile] Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert("Error", "Failed to sign out");
            }
          },
        },
      ]
    );
  };

  const getColorDisplay = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      'Red': '#FF0000',
      'Blue': '#0000FF',
      'Green': '#00FF00',
      'Yellow': '#FFFF00',
      'Purple': '#800080',
      'Orange': '#FFA500',
      'Pink': '#FFC0CB',
      'Black': '#000000',
      'White': '#FFFFFF',
      'Brown': '#8B4513',
      'Gray': '#808080',
    };
    return colorMap[colorName] || colors.primary;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isFirstLogin ? 'Complete Your Profile' : 'Profile'}
          </Text>
          {isFirstLogin && (
            <Text style={styles.headerSubtitle}>
              Let&apos;s set up your profile to get started
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          <Text style={styles.editButtonText}>
            {isFirstLogin ? 'Complete' : (isEditing ? 'Save' : 'Edit')}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {isFirstLogin && (
          <View style={styles.welcomeCard}>
            <IconSymbol
              ios_icon_name="hand.wave.fill"
              android_material_icon_name="waving-hand"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.welcomeTitle}>
              Welcome to THE ROSTER!
            </Text>
            <Text style={styles.welcomeText}>
              Complete your profile to personalize your experience. You can always update this later.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.imageContainer}
          onPress={isEditing ? pickImage : undefined}
          disabled={!isEditing}
        >
          {profileImage || user?.image ? (
            <Image
              source={{ uri: profileImage || user?.image }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, styles.placeholderImage]}>
              <IconSymbol
                ios_icon_name="person.circle.fill"
                android_material_icon_name="account-circle"
                size={100}
                color={colors.primary}
              />
            </View>
          )}
          {isEditing && (
            <View style={styles.imageOverlay}>
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera"
                size={32}
                color="#fff"
              />
              <Text style={styles.imageOverlayText}>Tap to change</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.fieldsContainer}>
          <View style={styles.section}>
            <Text style={styles.label}>Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                editable={isEditing}
                placeholder="Your name"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={styles.valueText}>{name || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Age</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                editable={isEditing}
                placeholder="Your age"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
              />
            ) : (
              <Text style={styles.valueText}>{age || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                editable={isEditing}
                placeholder="City, State"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={styles.valueText}>{location || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={isEditing}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.valueText}>{phoneNumber || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Favorite Color</Text>
            {isEditing ? (
              <TouchableOpacity
                style={[styles.input, styles.pickerButton]}
                onPress={() => isEditing && setShowColorPicker(true)}
                disabled={!isEditing}
              >
                <View style={styles.colorDisplay}>
                  {favoriteColor && (
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: getColorDisplay(favoriteColor) }
                      ]}
                    />
                  )}
                  <Text style={[styles.pickerText, { color: favoriteColor ? colors.text : colors.textSecondary }]}>
                    {favoriteColor || 'Select color'}
                  </Text>
                </View>
                {isEditing && (
                  <IconSymbol
                    ios_icon_name="chevron.down"
                    android_material_icon_name="arrow-drop-down"
                    size={20}
                    color={colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.colorDisplay}>
                {favoriteColor && (
                  <View
                    style={[
                      styles.colorCircle,
                      { backgroundColor: getColorDisplay(favoriteColor) }
                    ]}
                  />
                )}
                <Text style={styles.valueText}>{favoriteColor || 'Not set'}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Favorite Food Type</Text>
            {isEditing ? (
              <TouchableOpacity
                style={[styles.input, styles.pickerButton]}
                onPress={() => isEditing && setShowFoodPicker(true)}
                disabled={!isEditing}
              >
                <Text style={[styles.pickerText, { color: favoriteFoodType ? colors.text : colors.textSecondary }]}>
                  {favoriteFoodType || 'Select food type'}
                </Text>
                {isEditing && (
                  <IconSymbol
                    ios_icon_name="chevron.down"
                    android_material_icon_name="arrow-drop-down"
                    size={20}
                    color={colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.valueText}>{favoriteFoodType || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Instagram</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={instagram}
                onChangeText={setInstagram}
                editable={isEditing}
                placeholder="@username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.valueText}>{instagram || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Twitter/X</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={twitter}
                onChangeText={setTwitter}
                editable={isEditing}
                placeholder="@username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.valueText}>{twitter || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                editable={isEditing}
                placeholder="Personal notes..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            ) : (
              <Text style={styles.valueText}>{notes || 'No notes'}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.privacyButton}
            onPress={() => router.push('/privacy-policy')}
          >
            <IconSymbol
              ios_icon_name="lock.shield.fill"
              android_material_icon_name="security"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.privacyButtonText}>Privacy Policy</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.eulaButton}
            onPress={() => router.push('/eula')}
          >
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.eulaButtonText}>End User License Agreement</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {!isFirstLogin && (
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleSignOut}
            >
              <IconSymbol
                ios_icon_name="arrow.right.square.fill"
                android_material_icon_name="logout"
                size={20}
                color="#fff"
              />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowColorPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Select Favorite Color</Text>
                <ScrollView>
                  {FAVORITE_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={styles.pickerItem}
                      onPress={() => {
                        setFavoriteColor(color);
                        setShowColorPicker(false);
                      }}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: getColorDisplay(color) }
                        ]}
                      />
                      <Text style={styles.pickerItemText}>{color}</Text>
                      {favoriteColor === color && (
                        <IconSymbol
                          ios_icon_name="checkmark"
                          android_material_icon_name="check"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showFoodPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFoodPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFoodPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Select Favorite Food Type</Text>
                <ScrollView>
                  {FOOD_TYPES.map((food) => (
                    <TouchableOpacity
                      key={food}
                      style={styles.pickerItem}
                      onPress={() => {
                        setFavoriteFoodType(food);
                        setShowFoodPicker(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>{food}</Text>
                      {favoriteFoodType === food && (
                        <IconSymbol
                          ios_icon_name="checkmark"
                          android_material_icon_name="check"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 120, // FIX: Add extra padding for FloatingTabBar
  },
  welcomeCard: {
    backgroundColor: colors.card,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    color: colors.text,
  },
  welcomeText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 200,
    position: 'relative',
    marginBottom: 24,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  fieldsContainer: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.card,
  },
  valueText: {
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
  },
  colorDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  privacyButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  eulaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eulaButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingTop: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  pickerItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
});
