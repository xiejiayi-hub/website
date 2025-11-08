Core Mission  
To give every movie lover a "zero-barrier" online space where they can find like-minded fans  and dive straight into deep discussions—using only front-end tech to keep deployment simple and content-focused.

Main Features  
1. Interest Circles (Groups)  
- Create a "Kurosawa Fans" or "Nolanites" circle in one click—just add a name and short description.  
- All groups live in localStorage; switching circles is instantaneous and the sidebar updates "My Groups" on the fly.

2. Content Publishing & Interaction  
- Post inside any group with title + text; author and timestamp are auto-saved and special chars are escaped.  
- Interact at post level: click the author nick to jump to their profile; new posts appear immediately across tabs via BroadcastChannel.

3. User System  
- Registration / login / logout run purely in the browser (passwords in plain text for demo, ready for backend hashing).  
- Avatar upload is auto-resized to 320 px & <150 KB, stored as base64 and reflected instantly on every page.

4. Discovery & Recommendations  
- Global search box understands prefixes like "topic:" or "group:", routes to the right page and filters results automatically.  
- Movie grid and topic plaza both include a "Shuffle" button for instant random discovery.

5. Community Management  
- Circle creator = default admin; members can join or leave freely.  
- Activity metrics: post count is tracked in real time and displayed on circle cards, guiding users to active communities.

