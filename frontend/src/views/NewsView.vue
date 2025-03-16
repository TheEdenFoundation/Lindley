import { usePrayerTimesStore } from "../stores/prayerTimes"; const store =
usePrayerTimesStore(); const newsItems = ref([]); const currentBackgroundColor =
ref(""); const loading = ref(true); const error = ref(null); const isRamadan =
ref(false); const showTaraweehDua = ref(false); const taraweehDuaItem =
ref(null); const currentTime = ref(new Date()); const taraweehDuaTimer =
ref(null); const taraweehDuaShownToday = ref(false); const lastShownDate =
ref(new Date().toDateString()); const isTaraweeh = computed(() => { if
(!store.originalTodayData.length) return false; const ishaTime =
store.originalTodayData.find(prayer => prayer.Name === "Isha"); if (!ishaTime)
return false; const ishaJamatTime = ishaTime["Jamat Time (24hr)"]; if
(!ishaJamatTime) return false; // Parse Isha Jamat time and add 15 minutes for
Taraweeh const [hours, minutes] = ishaJamatTime.split(":").map(Number); const
taraweehTime = new Date(); taraweehTime.setHours(hours);
taraweehTime.setMinutes(minutes + 15); taraweehTime.setSeconds(0); // Get
current time const now = currentTime.value; const taraweehEndTime = new
Date(taraweehTime); taraweehEndTime.setMinutes(taraweehTime.getMinutes() + 105);
// Taraweeh duration return now >= taraweehTime && now <= taraweehEndTime; });
