type ExerciseDetails = {
  bodyParts: string[];
  benefits: string[];
};

const details: Record<string, ExerciseDetails> = {
  "Crunches": {
    bodyParts: ["Upper abs", "Core"],
    benefits: ["Builds abdominal strength.", "Improves trunk control for daily movement."],
  },
  "Plank": {
    bodyParts: ["Core", "Shoulders", "Glutes"],
    benefits: ["Improves core stability.", "Helps posture and full-body tension control."],
  },
  "Mountain Climbers": {
    bodyParts: ["Core", "Hip flexors", "Shoulders", "Cardio"],
    benefits: ["Raises heart rate quickly.", "Trains core control while the legs move fast."],
  },
  "Russian Twists": {
    bodyParts: ["Obliques", "Core"],
    benefits: ["Strengthens side abs.", "Improves rotational control."],
  },
  "Leg Raises": {
    bodyParts: ["Lower abs", "Hip flexors"],
    benefits: ["Targets the lower core.", "Builds control through the hips and pelvis."],
  },
  "Push Ups": {
    bodyParts: ["Chest", "Triceps", "Shoulders", "Core"],
    benefits: ["Builds upper-body pushing strength.", "Trains core bracing under load."],
  },
  "Tricep Dips": {
    bodyParts: ["Triceps", "Shoulders", "Chest"],
    benefits: ["Strengthens the back of the arms.", "Improves pressing power for push movements."],
  },
  "Diamond Push Ups": {
    bodyParts: ["Triceps", "Inner chest", "Shoulders"],
    benefits: ["Focuses more work on the triceps.", "Builds close-grip pushing strength."],
  },
  "Arm Circles": {
    bodyParts: ["Shoulders", "Upper arms"],
    benefits: ["Warms up shoulder joints.", "Improves shoulder endurance and mobility."],
  },
  "Wide Push Ups": {
    bodyParts: ["Chest", "Shoulders", "Triceps"],
    benefits: ["Emphasizes the chest more than regular push ups.", "Builds upper-body strength."],
  },
  "Decline Push Ups": {
    bodyParts: ["Upper chest", "Shoulders", "Triceps"],
    benefits: ["Adds difficulty to push ups.", "Targets upper chest and shoulder strength."],
  },
  "Chest Squeeze": {
    bodyParts: ["Chest", "Shoulders"],
    benefits: ["Activates the chest without equipment.", "Improves mind-muscle connection."],
  },
  "Squats": {
    bodyParts: ["Quads", "Glutes", "Hamstrings", "Core"],
    benefits: ["Builds lower-body strength.", "Improves sitting, standing, and climbing mechanics."],
  },
  "Lunges": {
    bodyParts: ["Quads", "Glutes", "Hamstrings", "Balance"],
    benefits: ["Strengthens each leg individually.", "Improves balance and hip control."],
  },
  "Jump Squats": {
    bodyParts: ["Quads", "Glutes", "Calves", "Cardio"],
    benefits: ["Builds explosive leg power.", "Raises heart rate while training the legs."],
  },
  "Calf Raises": {
    bodyParts: ["Calves", "Ankles"],
    benefits: ["Strengthens lower legs.", "Supports ankle stability and walking power."],
  },
  "Wall Sit": {
    bodyParts: ["Quads", "Glutes", "Core"],
    benefits: ["Builds leg endurance.", "Improves mental toughness during static holds."],
  },
  "Pike Push Ups": {
    bodyParts: ["Shoulders", "Triceps", "Upper chest"],
    benefits: ["Builds overhead pressing strength.", "Prepares shoulders for harder bodyweight skills."],
  },
  "Shoulder Taps": {
    bodyParts: ["Core", "Shoulders", "Chest"],
    benefits: ["Improves shoulder stability.", "Trains anti-rotation core strength."],
  },
  "Arm Raises": {
    bodyParts: ["Shoulders", "Upper back"],
    benefits: ["Improves shoulder endurance.", "Helps posture by engaging upper-back support muscles."],
  },
  "Burpees": {
    bodyParts: ["Full body", "Chest", "Legs", "Cardio"],
    benefits: ["Trains strength and conditioning together.", "Burns energy quickly with minimal space."],
  },
  "Jumping Jacks": {
    bodyParts: ["Full body", "Calves", "Shoulders", "Cardio"],
    benefits: ["Warms up the whole body.", "Improves rhythm and cardiovascular readiness."],
  },
  "High Knees": {
    bodyParts: ["Hip flexors", "Core", "Calves", "Cardio"],
    benefits: ["Raises heart rate fast.", "Improves knee drive and running mechanics."],
  },
  "Bear Crawl": {
    bodyParts: ["Core", "Shoulders", "Quads", "Glutes"],
    benefits: ["Builds total-body coordination.", "Improves core stability while moving."],
  },
  "Jog in Place": {
    bodyParts: ["Cardio", "Calves", "Quads", "Hip flexors"],
    benefits: ["Gently raises body temperature.", "Prepares the legs and lungs for training."],
  },
  "Arm Swings": {
    bodyParts: ["Shoulders", "Chest", "Upper back"],
    benefits: ["Loosens the shoulders and chest.", "Prepares the upper body for pushing and pulling."],
  },
  "Hip Circles": {
    bodyParts: ["Hips", "Glutes", "Lower back"],
    benefits: ["Improves hip mobility.", "Prepares the pelvis and lower back for squats, lunges, and cardio."],
  },
  "Forward Fold": {
    bodyParts: ["Hamstrings", "Lower back", "Calves"],
    benefits: ["Releases the back of the legs.", "Helps calm breathing after training."],
  },
  "Cat Cow": {
    bodyParts: ["Spine", "Core", "Upper back"],
    benefits: ["Improves spinal mobility.", "Reduces stiffness through the back and neck."],
  },
  "Child's Pose": {
    bodyParts: ["Lower back", "Hips", "Shoulders"],
    benefits: ["Promotes recovery breathing.", "Gently stretches hips, back, and shoulders."],
  },
  "Cobra Stretch": {
    bodyParts: ["Abs", "Chest", "Spine"],
    benefits: ["Opens the front body.", "Counters rounded posture after core or push exercises."],
  },
};

export function getExerciseDetails(name: string): ExerciseDetails {
  return details[name] || {
    bodyParts: ["Full body"],
    benefits: ["Builds movement quality.", "Supports strength, mobility, and conditioning."],
  };
}
