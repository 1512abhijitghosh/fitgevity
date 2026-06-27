"""Seed data for Limitless Home Workout.

Each exercise has two demonstration images (start + end position) from the
free-exercise-db repo. We alternate them at runtime to create a stop-motion
animation effect.
"""

EX_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"


def imgs(folder: str):
    return [f"{EX_BASE}/{folder}/0.jpg", f"{EX_BASE}/{folder}/1.jpg"]


# Category hero images (Unsplash)
IMG_ABS = "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=900&q=80"
IMG_ARMS = "https://images.pexels.com/photos/3838389/pexels-photo-3838389.jpeg?auto=compress&cs=tinysrgb&w=900"
IMG_CHEST = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80"
IMG_LEGS = "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=900&q=80"
IMG_SHOULDERS = "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80"
IMG_FULL_BODY = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80"
IMG_WARMUP = "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80"
IMG_STRETCH = "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=900&q=80"

CATEGORIES = [
    {"id": "abs", "name": "Abs", "icon": "Flame", "image": IMG_ABS, "color": "#FF4500"},
    {"id": "arms", "name": "Arms", "icon": "Barbell", "image": IMG_ARMS, "color": "#FF7043"},
    {"id": "chest", "name": "Chest", "icon": "Heart", "image": IMG_CHEST, "color": "#FF453A"},
    {"id": "legs", "name": "Legs", "icon": "PersonSimpleRun", "image": IMG_LEGS, "color": "#FFD60A"},
    {"id": "shoulders", "name": "Shoulders", "icon": "ArrowsOut", "image": IMG_SHOULDERS, "color": "#0A84FF"},
    {"id": "full_body", "name": "Full Body", "icon": "Lightning", "image": IMG_FULL_BODY, "color": "#32D74B"},
    {"id": "warm_up", "name": "Warm Up", "icon": "Sun", "image": IMG_WARMUP, "color": "#FF7043"},
    {"id": "stretching", "name": "Stretching", "icon": "Yoga", "image": IMG_STRETCH, "color": "#32D74B"},
]

EXERCISES = {
    "abs": [
        {"name": "Crunches", "duration": 30, "rest": 15, "frames": imgs("Cross-Body_Crunch"), "instructions": [
            "Lie flat on your back with knees bent.",
            "Place hands behind your head, elbows wide.",
            "Engage your core and curl shoulders off the floor.",
            "Hold for a second, then lower slowly.",
        ]},
        {"name": "Plank", "duration": 45, "rest": 20, "frames": imgs("Plank"), "instructions": [
            "Start in a forearm plank position.",
            "Keep your body in a straight line from head to heels.",
            "Squeeze your glutes and brace your core.",
            "Breathe steadily and hold the position.",
        ]},
        {"name": "Mountain Climbers", "duration": 30, "rest": 15, "frames": imgs("Mountain_Climbers"), "instructions": [
            "Start in a high plank position.",
            "Drive one knee at a time toward your chest.",
            "Alternate legs in a running motion.",
            "Keep your hips low and core tight.",
        ]},
        {"name": "Russian Twists", "duration": 30, "rest": 15, "frames": imgs("Russian_Twist"), "instructions": [
            "Sit with knees bent, lean back slightly.",
            "Lift feet off the floor for added challenge.",
            "Twist your torso side to side.",
            "Tap the floor on each side.",
        ]},
        {"name": "Leg Raises", "duration": 30, "rest": 20, "frames": imgs("Flat_Bench_Lying_Leg_Raise"), "instructions": [
            "Lie flat on your back, legs straight.",
            "Place hands beside your hips.",
            "Lift legs to 90 degrees, then lower slowly.",
            "Avoid letting feet touch the floor.",
        ]},
    ],
    "arms": [
        {"name": "Push Ups", "duration": 30, "rest": 20, "frames": imgs("Pushups"), "instructions": [
            "Start in a high plank, hands shoulder-width apart.",
            "Keep your body in a straight line.",
            "Lower until chest nearly touches the floor.",
            "Push back up explosively.",
        ]},
        {"name": "Tricep Dips", "duration": 30, "rest": 20, "frames": imgs("Bench_Dips"), "instructions": [
            "Sit on the edge of a chair, hands gripping the edge.",
            "Slide forward, supporting weight with arms.",
            "Lower hips by bending elbows to 90 degrees.",
            "Press back up to start.",
        ]},
        {"name": "Diamond Push Ups", "duration": 25, "rest": 25, "frames": imgs("Close-Grip_Push-Up_off_of_a_Dumbbell"), "instructions": [
            "Form a diamond shape with your hands under your chest.",
            "Lower your chest to your hands.",
            "Keep elbows close to your body.",
            "Push back up.",
        ]},
        {"name": "Arm Circles", "duration": 30, "rest": 10, "frames": imgs("Arm_Circles"), "instructions": [
            "Stand with arms extended to the sides.",
            "Make small circles forward.",
            "Reverse direction halfway through.",
            "Keep arms straight and shoulders down.",
        ]},
    ],
    "chest": [
        {"name": "Wide Push Ups", "duration": 30, "rest": 20, "frames": imgs("Pushups"), "instructions": [
            "Place hands wider than shoulder width.",
            "Keep body in a straight line.",
            "Lower chest to the floor.",
            "Push back up powerfully.",
        ]},
        {"name": "Decline Push Ups", "duration": 30, "rest": 25, "frames": imgs("Decline_Push-Up"), "instructions": [
            "Place feet on a raised surface.",
            "Hands shoulder-width on the floor.",
            "Lower chest to the floor.",
            "Press back up.",
        ]},
        {"name": "Chest Squeeze", "duration": 30, "rest": 15, "frames": imgs("Pushups"), "instructions": [
            "Stand tall, palms together in front of chest.",
            "Press palms together firmly.",
            "Hold the squeeze.",
            "Release and repeat.",
        ]},
    ],
    "legs": [
        {"name": "Squats", "duration": 40, "rest": 20, "frames": imgs("Bodyweight_Squat"), "instructions": [
            "Stand with feet shoulder-width apart.",
            "Lower hips back and down as if sitting.",
            "Keep chest up and knees over toes.",
            "Drive through heels to stand.",
        ]},
        {"name": "Lunges", "duration": 40, "rest": 20, "frames": imgs("Bodyweight_Walking_Lunge"), "instructions": [
            "Step forward into a long stride.",
            "Lower back knee toward the floor.",
            "Front knee at 90 degrees.",
            "Push back to start and alternate legs.",
        ]},
        {"name": "Jump Squats", "duration": 30, "rest": 25, "frames": imgs("Freehand_Jump_Squat"), "instructions": [
            "Start in a squat position.",
            "Explode upward into a jump.",
            "Land softly back in squat.",
            "Repeat with control.",
        ]},
        {"name": "Calf Raises", "duration": 30, "rest": 15, "frames": imgs("Standing_Calf_Raises"), "instructions": [
            "Stand with feet hip-width apart.",
            "Press up onto the balls of your feet.",
            "Hold at the top for a second.",
            "Lower with control.",
        ]},
        {"name": "Wall Sit", "duration": 45, "rest": 25, "frames": imgs("Bodyweight_Squat"), "instructions": [
            "Lean back against a wall.",
            "Slide down until knees are at 90 degrees.",
            "Keep back flat against the wall.",
            "Hold and breathe.",
        ]},
    ],
    "shoulders": [
        {"name": "Pike Push Ups", "duration": 30, "rest": 25, "frames": imgs("Hanging_Pike"), "instructions": [
            "Form an inverted V with your body.",
            "Lower head toward the floor.",
            "Press back up.",
            "Keep core engaged.",
        ]},
        {"name": "Shoulder Taps", "duration": 30, "rest": 15, "frames": imgs("Plank"), "instructions": [
            "Start in a high plank.",
            "Tap left hand to right shoulder.",
            "Alternate hands.",
            "Keep hips stable.",
        ]},
        {"name": "Arm Raises", "duration": 30, "rest": 15, "frames": imgs("Arm_Circles"), "instructions": [
            "Stand tall, arms by sides.",
            "Raise arms to shoulder height.",
            "Lower with control.",
            "Repeat steadily.",
        ]},
    ],
    "full_body": [
        {"name": "Burpees", "duration": 30, "rest": 25, "frames": imgs("Mountain_Climbers"), "instructions": [
            "Squat down and place hands on floor.",
            "Jump feet back to plank.",
            "Perform a push up (optional).",
            "Jump feet forward and explode up.",
        ]},
        {"name": "Jumping Jacks", "duration": 40, "rest": 15, "frames": imgs("Rope_Jumping"), "instructions": [
            "Stand with feet together, arms by sides.",
            "Jump while spreading legs and raising arms.",
            "Return to start.",
            "Maintain a steady rhythm.",
        ]},
        {"name": "High Knees", "duration": 30, "rest": 15, "frames": imgs("Jogging_Treadmill"), "instructions": [
            "Run in place.",
            "Drive knees up to hip height.",
            "Pump arms naturally.",
            "Stay light on your feet.",
        ]},
        {"name": "Bear Crawl", "duration": 30, "rest": 25, "frames": imgs("Bear_Crawl_Sled_Drags"), "instructions": [
            "Hands and feet on the floor, knees just off ground.",
            "Crawl forward moving opposite hand and foot.",
            "Keep core tight, hips low.",
            "Reverse direction.",
        ]},
    ],
    "warm_up": [
        {"name": "Jog in Place", "duration": 60, "rest": 10, "frames": imgs("Jogging_Treadmill"), "instructions": [
            "Run lightly in place.",
            "Lift knees comfortably.",
            "Pump arms.",
            "Find a steady pace.",
        ]},
        {"name": "Arm Swings", "duration": 30, "rest": 10, "frames": imgs("Arm_Circles"), "instructions": [
            "Swing arms across the body.",
            "Open wide and cross.",
            "Stay loose.",
            "Keep core engaged.",
        ]},
        {"name": "Hip Circles", "duration": 30, "rest": 10, "frames": imgs("Standing_Hip_Circles"), "instructions": [
            "Hands on hips.",
            "Make big circles with hips.",
            "Reverse halfway through.",
            "Stay smooth.",
        ]},
    ],
    "stretching": [
        {"name": "Forward Fold", "duration": 40, "rest": 10, "frames": imgs("Toe_Touchers"), "instructions": [
            "Stand tall, feet hip-width.",
            "Hinge at the hips, reach for toes.",
            "Relax the head and neck.",
            "Breathe deeply.",
        ]},
        {"name": "Cat Cow", "duration": 45, "rest": 10, "frames": imgs("Cat_Stretch"), "instructions": [
            "On hands and knees.",
            "Inhale, arch back (cow).",
            "Exhale, round back (cat).",
            "Flow with breath.",
        ]},
        {"name": "Child's Pose", "duration": 45, "rest": 10, "frames": imgs("Childs_Pose"), "instructions": [
            "Kneel and sit back on heels.",
            "Reach arms forward, forehead to floor.",
            "Relax shoulders.",
            "Breathe deep.",
        ]},
        {"name": "Cobra Stretch", "duration": 30, "rest": 10, "frames": imgs("All_Fours_Quad_Stretch"), "instructions": [
            "Lie on stomach, hands by chest.",
            "Press up, lifting chest.",
            "Keep hips down.",
            "Look up gently.",
        ]},
    ],
}

PLANS = [
    {"id": "beginner_full", "name": "Beginner Full Body", "level": "Beginner", "duration_min": 15, "image": IMG_FULL_BODY, "categories": ["warm_up", "full_body", "stretching"], "exercise_count": 8, "is_premium": False},
    {"id": "intermediate_abs", "name": "Intermediate Abs Burner", "level": "Intermediate", "duration_min": 20, "image": IMG_ABS, "categories": ["warm_up", "abs", "stretching"], "exercise_count": 10, "is_premium": False},
    {"id": "advanced_strength", "name": "Advanced Strength", "level": "Advanced", "duration_min": 30, "image": IMG_ARMS, "categories": ["warm_up", "arms", "chest", "shoulders", "stretching"], "exercise_count": 14, "is_premium": True},
    {"id": "leg_day", "name": "Leg Day Crusher", "level": "Intermediate", "duration_min": 25, "image": IMG_LEGS, "categories": ["warm_up", "legs", "stretching"], "exercise_count": 12, "is_premium": False},
    {"id": "hiit_blast", "name": "HIIT Cardio Blast", "level": "Advanced", "duration_min": 20, "image": IMG_FULL_BODY, "categories": ["warm_up", "full_body"], "exercise_count": 10, "is_premium": True},
]
