delete from categories;
delete from interests;

INSERT INTO categories (id, name, emoji, description) values
  ('a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c', 'Technology', '💻', 'The world of modern technology, covering innovations and advancements in computing, software, and hardware.'),
  ('b2c3d4e5-f6a7-48b9-0c1d-2e3f4a5b6c7d', 'Sports', '🏅', 'The competitive field involving physical activity, ranging from team sports to individual athletic pursuits.'),
  ('c3d4e5f6-a7b8-49c0-1d2e-3f4a5b6c7d8e', 'Art & Design', '🎨', 'Creative fields including visual arts, sculpture, photography, and various design practices.'),
  ('d4e5f6a7-b8c9-40d1-2e3f-4a5b6c7d8e9f', 'Nature & Outdoors', '🌳', 'Exploring the natural world, including wildlife, hiking, environmentalism, and outdoor adventures.'),
  ('e5f6a7b8-c9d0-41e2-3f4a-5b6c7d8e9f0a', 'Health & Wellness', '🧘‍♂️', 'Topics related to physical and mental health, fitness, nutrition, and self-care.'),
  ('f6a7b8c9-d0e1-42f3-4a5b-6c7d8e9f0a1b', 'Education', '🎓', 'The process of learning and teaching, from formal education to self-study and alternative learning methods.'),
  ('a7b8c9d0-e1f2-43a4-5b6c-7d8e9f0a1b2c', 'Entertainment', '🎬', 'Movies, TV shows, music, and all forms of entertainment that engage and inspire people.'),
  ('b8c9d0e1-f2a3-44b5-6c7d-8e9f0a1b2c3d', 'Music & Audio', '🎶', 'Genres of music, audio production, live performances, and sound-based content.'),
  ('c9d0e1f2-a3b4-45c6-7d8e-9f0a1b2c3d4e', 'Science & Space', '🔬', 'Discovering the universe, from deep space exploration to scientific breakthroughs on Earth.'),
  ('d0e1f2a3-b4c5-46d7-8e9f-0a1b2c3d4e5f', 'Politics & Society', '⚖️', 'Discussions surrounding governance, global affairs, laws, and societal issues.'),
  ('e1f2a3b4-c5d6-47e8-9f0a-1b2c3d4e5f6a', 'Business & Finance', '💼', 'Everything about companies, entrepreneurship, financial management, and investments.'),
  ('f2a3b4c5-d6e7-48f9-0a1b-2c3d4e5f6a7b', 'Lifestyle', '🏡', 'A broad category covering personal development, minimalism, home decor, and everyday life.'),
  ('a3b4c5d6-e7f8-49a0-1b2c-3d4e5f6a7b8c', 'Food & Cooking', '🍽️', 'Exploring the world of food, from cooking recipes to dining experiences and culinary trends.'),
  ('b4c5d6e7-f8a9-50b1-2c3d-4e5f6a7b8c9d', 'Travel & Adventure', '🌍', 'Traveling to new places, discovering new cultures, and embarking on adventurous journeys.'),
  ('c5d6e7f8-a9b0-51c2-3d4e-5f6a7b8c9d0e', 'Gaming & Technology', '🎮', 'Video games, technology-driven entertainment, and innovations in the digital world.'),
  ('d6e7f8a9-b0c1-52d3-4e5f-6a7b8c9d0e1f', 'Film & Television', '🍿', 'Everything related to the film industry, including movie reviews, celebrity news, and TV shows.'),
  ('e7f8a9b0-c1d2-53e4-5f6a-7b8c9d0e1f2a', 'News & Media', '📰', 'Global and local news, current events, and media coverage from various perspectives.'),
  ('f8a9b0c1-d2e3-54f5-6a7b-8c9d0e1f2a3b', 'Books & Literature', '📚', 'Reading and writing, from fiction to non-fiction, exploring different genres and literary styles.'),
  ('a9b0c1d2-e3f4-55a6-7b8c-9d0e1f2a3b4c', 'Social Justice & Equality', '✊', 'Advocacy for human rights, equality, and social reforms.'),
  ('b0c1d2e3-f4a5-56b7-8c9d-0e1f2a3b4c5d', 'Comedy', '😂', 'Comedy performances, stand-up, sketches, and everything that makes people laugh.'),
  ('c1d2e3f4-a5b6-57c8-9d0e-1f2a3b4c5d6e', 'History', '🏺', 'Exploring the past, from ancient civilizations to modern historical events.'),
  ('d2e3f4a5-b6c7-58d9-0e1f-2a3b4c5d6e7f', 'Philosophy', '🧠', 'Deep discussions and reflections on human existence, logic, and moral questions.'),
  ('e3f4a5b6-c7d8-59e0-1f2a-3b4c5d6e7f8a', 'Technology News', '📱', 'Latest trends, gadgets, and innovations in the tech industry.'),
  ('f4a5b6c7-d8e9-60f1-2a3b-4c5d6e7f8a9b', 'Spirituality & Religion', '🕉️', 'Exploring various religious beliefs, spiritual practices, and philosophical teachings.'),
  ('a5b6c7d8-e9f0-61a2-3b4c-5d6e7f8a9b0c', 'Animals & Pets', '🐶', 'Everything related to animals, whether pets, wild species, or conservation efforts.'),
  ('b6c7d8e9-f0a1-62b3-4c5d-6e7f8a9b0c1d', 'Photography & Videography', '📸', 'Capturing life through the lens—photography, video creation, and content creation techniques.'),
  ('c7d8e9f0-a1b2-63c4-5d6e-7f8a9b0c1d2e', 'Parenting', '👶', 'Advice and experiences for raising children, family life, and parenting tips.'),
  ('d8e9f0a1-b2c3-64d5-6e7f-8a9b0c1d2e3f', 'Real Estate', '🏠', 'The property market, home buying, renting, and real estate investment.'),
  ('e9f0a1b2-c3d4-65e6-7f8a-9b0c1d2e3f4a', 'Environment & Sustainability', '🌍', 'Environmental conservation, sustainability, and eco-friendly living.'),
  ('f0a1b2c3-d4e5-66f7-8a9b-0c1d2e3f4a5b', 'Cars & Motorcycles', '🚗', 'The world of vehicles, automotive industry, car culture, and road adventures.'),
  ('a1b2c3d4-e5f6-67a8-9b0c-1d2e3f4a5b6c', 'Photography', '📷', 'Aesthetic photography tips, techniques, and trends in the art of capturing moments.'),
  ('b2c3d4e5-f6a7-68b9-0c1d-2e3f4a5b6c7d', 'Fitness & Exercise', '💪', 'Everything about staying fit, workout plans, health goals, and physical training.'),
  ('c3d4e5f6-a7b8-69c0-1d2e-3f4a5b6c7d8e', 'Technology Gadgets', '📱', 'Latest gadgets, innovations, and tools that make life easier or more fun.'),
  ('d4e5f6a7-b8c9-70d1-2e3f-4a5b6c7d8e9f', 'Cooking & Baking', '🍰', 'Recipes, kitchen tips, baking techniques, and culinary explorations for beginners and experts alike.'),
  ('e5f6a7b8-c9d0-71e2-3f4a-5b6c7d8e9f0a', 'Crafts & DIY', '🛠️', 'Do it yourself—crafting, making your own home decor, and other handmade creations.'),
  ('f6a7b8c9-d0e1-72f3-4a5b-6c7d8e9f0a1b', 'Fitness', '🏋️‍♀️', 'Strength training, cardio, flexibility exercises, and maintaining overall physical health.'),
  ('a7b8c9d0-e1f2-73a4-5b6c-7d8e9f0a1b2c', 'Tech Startups', '🚀', 'Innovative and disruptive new companies shaping the future of technology.'),
  ('b8c9d0e1-f2a3-74b5-6c7d-8e9f0a1b2c3d', 'Self Improvement', '🧗‍♂️', 'Personal growth, mental health, and continuous self-improvement strategies.'),
  ('c9d0e1f2-a3b4-75c6-7d8e-9f0a1b2c3d4e', 'Technology Careers', '💼', 'Pursuing a career in tech, whether coding, UX, or other tech industry roles.'),
  ('d0e1f2a3-b4c5-76d7-8e9f-0a1b2c3d4e5f', 'Entrepreneurship', '👩‍💼', 'Starting and running your own business, including challenges and strategies for success.'),
  ('e1f2a3b4-c5d6-77e8-9f0a-1b2c3d4e5f6a', 'Motivation', '💡', 'Inspiration, motivational quotes, and strategies to stay driven and focused.'),
  ('f2a3b4c5-d6e7-78f9-0a1b-2c3d4e5f6a7b', 'Digital Marketing', '📈', 'Marketing techniques, strategies for growing your online presence, and trends in the digital marketing world.'),
  ('a3b4c5d6-e7f8-79a0-1b2c-3d4e5f6a7b8c', 'Education Technology', '🖥️', 'Tools, platforms, and innovations improving education through technology.'),
  ('b4c5d6e7-f8a9-80b1-2c3d-4e5f6a7b8c9d', 'Innovation', '💡', 'New ideas, breakthrough innovations, and how these are transforming various industries.'),
  ('c5d6e7f8-a9b0-81c2-3d4e-5f6a7b8c9d0e', 'Climate Change', '🌡️', 'Awareness and actions for mitigating climate change and its effects on the planet.'),
  ('d6e7f8a9-b0c1-82d3-4e5f-6a7b8c9d0e1f', 'Virtual Reality', '🕶️', 'Exploring virtual environments and experiences in entertainment, gaming, and education.'),
  ('e7f8a9b0-c1d2-83e4-5f6a-7b8c9d0e1f2a', 'Augmented Reality', '🌍', 'Digital overlay of information on the real world, from games to practical uses in education and business.'),
  ('f8a9b0c1-d2e3-84f5-6a7b-8c9d0e1f2a3b', 'Legal Advice', '⚖️', 'Providing legal guidance on personal, business, and civil matters.'),
  ('a9b0c1d2-e3f4-85a6-7b8c-9d0e1f2a3b4c', 'Finance & Investing', '💰', 'Advice on money management, stocks, crypto, and financial planning.'),
  ('b0c1d2e3-f4a5-86b7-8c9d-0e1f2a3b4c5d', 'Startup Advice', '📊', 'Advice for those looking to launch, grow, and scale their own startup.');

INSERT INTO interests (category_id, name, emoji, description) VALUES
  ('a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c', 'Software Development', '💻', 'The art of designing, coding, and maintaining software applications.'),
  ('a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c', 'Artificial Intelligence', '🤖', 'The development of machines and systems capable of performing tasks that require human intelligence.'),
  ('a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c', 'Web Development', '🌐', 'The creation of websites and applications for the internet, focusing on design, functionality, and user experience.'),
  ('a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c', 'Cybersecurity', '🛡️', 'Protecting systems, networks, and programs from digital attacks.'),
  ('a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c', 'Blockchain Technology', '⛓️', 'A decentralized ledger of transactions that ensures transparency and security in digital exchanges.');

INSERT INTO interests (category_id, name, emoji, description) VALUES
  ('b2c3d4e5-f6a7-48b9-0c1d-2e3f4a5b6c7d', 'Football', '⚽', 'The sport involving two teams of eleven players aiming to score goals by putting the ball into the opposing team''s net.'),
  ('b2c3d4e5-f6a7-48b9-0c1d-2e3f4a5b6c7d', 'Basketball', '🏀', 'A team sport in which two teams of five players each try to score by shooting a ball through the opposing team''s hoop.'),
  ('b2c3d4e5-f6a7-48b9-0c1d-2e3f4a5b6c7d', 'Tennis', '🎾', 'A sport played individually or in pairs, where players use rackets to hit a ball over a net.'),
  ('b2c3d4e5-f6a7-48b9-0c1d-2e3f4a5b6c7d', 'Running', '🏃‍♂️', 'Competitive running events including marathons, sprints, and cross-country.'),
  ('b2c3d4e5-f6a7-48b9-0c1d-2e3f4a5b6c7d', 'Cycling', '🚴‍♂️', 'Riding bicycles for sport, recreation, or transportation.');

INSERT INTO interests (category_id, name, emoji, description) VALUES
  ('c3d4e5f6-a7b8-49c0-1d2e-3f4a5b6c7d8e', 'Graphic Design', '🖼️', 'Creating visual content to communicate messages through digital or print media.'),
  ('c3d4e5f6-a7b8-49c0-1d2e-3f4a5b6c7d8e', 'Photography', '📸', 'The practice of capturing images using a camera for artistic or documentary purposes.'),
  ('c3d4e5f6-a7b8-49c0-1d2e-3f4a5b6c7d8e', 'Interior Design', '🛋️', 'The art of enhancing the interior of a building to create a healthier and more aesthetically pleasing environment.'),
  ('c3d4e5f6-a7b8-49c0-1d2e-3f4a5b6c7d8e', 'Fashion Design', '👗', 'Designing clothing and accessories in creative and functional ways.'),
  ('c3d4e5f6-a7b8-49c0-1d2e-3f4a5b6c7d8e', 'Digital Illustration', '🖌️', 'Creating artwork using digital tools and software for various creative purposes.');

INSERT INTO interests (category_id, name, emoji, description) VALUES
  ('d4e5f6a7-b8c9-40d1-2e3f-4a5b6c7d8e9f', 'Hiking', '🥾', 'Walking long distances, often in the countryside or mountains, for pleasure or exercise.'),
  ('d4e5f6a7-b8c9-40d1-2e3f-4a5b6c7d8e9f', 'Camping', '🏕️', 'Staying overnight in a tent or shelter, usually in the wilderness.'),
  ('d4e5f6a7-b8c9-40d1-2e3f-4a5b6c7d8e9f', 'Wildlife Photography', '📷🦁', 'Capturing photos of animals and nature in their natural habitats.'),
  ('d4e5f6a7-b8c9-40d1-2e3f-4a5b6c7d8e9f', 'Birdwatching', '🐦', 'Observing and identifying birds in their natural environment.'),
  ('d4e5f6a7-b8c9-40d1-2e3f-4a5b6c7d8e9f', 'Conservation', '🌍', 'Efforts to preserve, protect, and restore the natural environment and wildlife.');

INSERT INTO interests (category_id, name, emoji, description) VALUES
  ('e5f6a7b8-c9d0-41e2-3f4a-5b6c7d8e9f0a', 'Mental Health', '🧠', 'The emotional, psychological, and social well-being affecting how we think, feel, and act.'),
  ('e5f6a7b8-c9d0-41e2-3f4a-5b6c7d8e9f0a', 'Fitness', '🏋️‍♂️', 'Exercise routines and activities designed to improve physical health and well-being.'),
  ('e5f6a7b8-c9d0-41e2-3f4a-5b6c7d8e9f0a', 'Yoga', '🧘‍♀️', 'A mind and body practice that uses breathing techniques, strength, and flexibility exercises.'),
  ('e5f6a7b8-c9d0-41e2-3f4a-5b6c7d8e9f0a', 'Nutrition', '🥗', 'The science of food and its role in health and wellness.'),
  ('e5f6a7b8-c9d0-41e2-3f4a-5b6c7d8e9f0a', 'Meditation', '🧘‍♂️', 'A practice of calming the mind and enhancing self-awareness through focused attention and relaxation.');

INSERT INTO interests (category_id, name, emoji, description) VALUES
  ('f6a7b8c9-d0e1-42f3-4a5b-6c7d8e9f0a1b', 'Online Learning', '💻', 'Education delivered over the internet, often with flexible scheduling.'),
  ('f6a7b8c9-d0e1-42f3-4a5b-6c7d8e9f0a1b', 'Language Learning', '🗣️', 'The process of learning a new language to improve communication skills.'),
  ('f6a7b8c9-d0e1-42f3-4a5b-6c7d8e9f0a1b', 'STEM Education', '🔬', 'Education in Science, Technology, Engineering, and Mathematics fields.'),
  ('f6a7b8c9-d0e1-42f3-4a5b-6c7d8e9f0a1b', 'Classroom Teaching', '🏫', 'Traditional education in a physical classroom with a teacher and students.'),
  ('f6a7b8c9-d0e1-42f3-4a5b-6c7d8e9f0a1b', 'Study Tips', '📚', 'Tips and tricks to improve study habits, efficiency, and retention.');

INSERT INTO interests (category_id, name, emoji, description) VALUES
  ('a7b8c9d0-e1f2-43a4-5b6c-7d8e9f0a1b2c', 'Movies', '🎥', 'Cinematic art and entertainment through films across various genres.'),
  ('a7b8c9d0-e1f2-43a4-5b6c-7d8e9f0a1b2c', 'TV Shows', '📺', 'Entertainment via serialized programs broadcast on television.'),
  ('a7b8c9d0-e1f2-43a4-5b6c-7d8e9f0a1b2c', 'Music Videos', '🎬🎶', 'The visual representations or performances that accompany music tracks.'),
  ('a7b8c9d0-e1f2-43a4-5b6c-7d8e9f0a1b2c', 'Stand-Up Comedy', '🎤', 'Comedic performances, often performed solo in front of an audience.'),
  ('a7b8c9d0-e1f2-43a4-5b6c-7d8e9f0a1b2c', 'Podcasting', '🎧', 'Audio content distributed over the internet, often focusing on niche topics.');

INSERT INTO interests (category_id, name, emoji, description) VALUES
  ('b8c9d0e1-f2a3-44b5-6c7d-8e9f0a1b2c3d', 'Rock Music', '🤘', 'A genre of popular music with a strong rhythm, often involving electric guitars and drums.'),
  ('b8c9d0e1-f2a3-44b5-6c7d-8e9f0a1b2c3d', 'Classical Music', '🎻', 'Orchestral and instrumental music composed during a specific period.'),
  ('b8c9d0e1-f2a3-44b5-6c7d-8e9f0a1b2c3d', 'Electronic Music', '🎶💻', 'Music that primarily uses electronic devices, synthesizers, and computers for production.'),
  ('b8c9d0e1-f2a3-44b5-6c7d-8e9f0a1b2c3d', 'Music Production', '🎚️', 'The process of creating, recording, and arranging music.'),
  ('b8c9d0e1-f2a3-44b5-6c7d-8e9f0a1b2c3d', 'Audio Engineering', '🎛️', 'The technical aspect of music production, involving recording and sound manipulation.');

INSERT INTO interests (category_id, name, emoji, description) VALUES
  ('c9d0e1f2-a3b4-45c6-7d8e-9f0a1b2c3d4e', 'Astronomy', '🌌', 'The study of celestial objects, space, and the universe beyond Earth.'),
  ('c9d0e1f2-a3b4-45c6-7d8e-9f0a1b2c3d4e', 'Physics', '⚛️', 'The natural science that deals with the structure of matter and how the fundamental components of the universe interact.'),
  ('c9d0e1f2-a3b4-45c6-7d8e-9f0a1b2c3d4e', 'Space Exploration', '🚀', 'The investigation of outer space through missions, telescopes, and space vehicles.'),
  ('c9d0e1f2-a3b4-45c6-7d8e-9f0a1b2c3d4e', 'Quantum Computing', '💻', 'Computing based on quantum mechanics that promises to revolutionize computational power.'),
  ('c9d0e1f2-a3b4-45c6-7d8e-9f0a1b2c3d4e', 'Environmental Science', '🌱', 'The study of the environment and solutions to global ecological challenges.');

INSERT INTO interests (category_id, name, emoji, description) VALUES
  ('d0e1f2a3-b4c5-46d7-8e9f-0a1b2c3d4e5f', 'Human Rights', '✊', 'The basic rights and freedoms that belong to every person in the world.'),
  ('d0e1f2a3-b4c5-46d7-8e9f-0a1b2c3d4e5f', 'Government Policy', '🏛️', 'The plans and actions that governments take to address various public issues.'),
  ('d0e1f2a3-b4c5-46d7-8e9f-0a1b2c3d4e5f', 'Political Activism', '📢', 'Efforts to promote or oppose political causes, often through protests or advocacy.'),
  ('d0e1f2a3-b4c5-46d7-8e9f-0a1b2c3d4e5f', 'Global Affairs', '🌍', 'The study of international relations and global cooperation or conflict.'),
  ('d0e1f2a3-b4c5-46d7-8e9f-0a1b2c3d4e5f', 'Social Media Politics', '📱', 'The role that social media plays in political discourse and campaigns.');